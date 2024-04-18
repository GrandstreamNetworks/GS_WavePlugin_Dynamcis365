import { DATE_FORMAT, EVENT_KEY, SESSION_STORAGE_KEY, WAVE_CALL_TYPE } from "@/constant";
import { formatDescription, formatPhoneNumber, getNotificationBody, getValueByConfig } from "@/utils/utils";
import { get } from "lodash";
import moment from "moment";
import { stringify } from "qs";
import React, { useCallback, useEffect, useRef } from "react";
import { Dispatch, GlobalModelState, connect, useIntl } from 'umi';

interface IndexProps {
    userConfig: LooseObject
    user: LooseObject
    getContact: (obj: LooseObject) => Promise<LooseObject>
    putCallInfo: (obj: LooseObject) => Promise<LooseObject>
    createNewContact: (obj: LooseObject) => Promise<LooseObject>
}

const IndexPage: React.FC<IndexProps> = ({ userConfig, user, getContact, putCallInfo, createNewContact }) => {

    const { formatMessage } = useIntl();

    const waveUserInfo = useRef<LooseObject>({})

    const callNumber = useRef<string | null>(null);

    // 当用户网络速度较慢时，获取联系人接口还未请求成功就挂断电话，此时关闭通知窗口先于打开调用， 导致通知窗口没有正确关闭
    // 当前通知弹窗展示的号码的展示状态: 解决还未展示通知就关闭通知的问题
    const callState = useRef(new Map<string, boolean>())

    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);

    const uploadCallInfo = useCallback((callNum: string, callStartTimeStamp: number, callEndTimeStamp: number, callDirection: string) => {
        if (!userConfig.uploadCall) {
            return;
        }
        getContact({ callNum, user, refresh_token: userConfig.CRMTokenInfo?.refresh_token }).then(contactInfo => {
            if (!contactInfo?.id) {
                return;
            }
            const duration = callEndTimeStamp - callStartTimeStamp;
            const duration_minutes = moment.duration(duration).hours() * 60 + moment.duration(duration).minutes()

            callEndTimeStamp = callEndTimeStamp || new Date().getTime();

            callStartTimeStamp = callStartTimeStamp || new Date().getTime();

            const configDescription = get(userConfig, ['uploadCallConfig', callDirection])

            const descriptionParams = {
                Agent: waveUserInfo.current.userName,
                AgentEmail: waveUserInfo.current.email,
                AgentFirstName: waveUserInfo.current.firstName,
                AgentLastName: waveUserInfo.current.lastName,
                CallDirection: callDirection,
                CallEndTimeLocal: moment(callEndTimeStamp).toLocaleString(),
                CallEndTimeUTC: moment(callEndTimeStamp).utc().format(),
                CallEndTimeUTCMillis: callEndTimeStamp,
                CallEstablishedTimeUTCMillis: callStartTimeStamp,
                CallEstablishedTimeLocal: moment(callStartTimeStamp).toLocaleString(),
                CallEstablishedTimeUTC: moment(callStartTimeStamp).utc().format(),
                CallStartTimeLocal: moment(callStartTimeStamp).toLocaleString(),
                CallStartTimeUTC: moment(callStartTimeStamp).utc().format(),
                CallStartTimeUTCMillis: callStartTimeStamp,
                CallType: callDirection,
                DateTime: moment(callStartTimeStamp).format(),
                Duration: moment().startOf('day').add(duration, 'ms').format(DATE_FORMAT.format_5),
                EntityId: contactInfo.id,
                EntityType: contactInfo.module,
                Name: contactInfo.fullname || contactInfo.name,
                Number: callNum
            }

            const toParty: LooseObject = {
                participationtypemask: callDirection === WAVE_CALL_TYPE.out ? 2 : 1,
            }

            if (contactInfo.contactid) {
                toParty['partyid_contact@odata.bind'] = `/contacts(${contactInfo.id})`
            }
            if (contactInfo.accountid) {
                toParty['partyid_account@odata.bind'] = `/accounts(${contactInfo.id})`
            }
            if (contactInfo.leadid) {
                toParty['partyid_lead@odata.bind'] = `/leads(${contactInfo.id})`
            }

            const data: LooseObject = {
                subject: formatDescription(userConfig.uploadCallConfig.subject, descriptionParams),
                description: formatDescription(configDescription, descriptionParams),
                statecode: 1,
                prioritycode: 1,
                actualstart: `${moment(callStartTimeStamp).format(DATE_FORMAT.format_4)}Z`,
                actualend: `${moment(callEndTimeStamp).format(DATE_FORMAT.format_4)}Z`,
                actualdurationminutes: duration_minutes,
                directioncode: callDirection === WAVE_CALL_TYPE.out,
                phonenumber: callNum,
                phonecall_activity_parties: [
                    {
                        participationtypemask: callDirection === WAVE_CALL_TYPE.out ? 1 : 2,
                        'partyid_systemuser@odata.bind': `/systemusers(${contactInfo.systemUserId})`
                    },
                    toParty
                ]
            }

            putCallInfo(data).then(res => {
                console.log('putCallInfo:', data, res);
            });
        })

    }, [userConfig, user]);

    const getUrl = (contactInfo: LooseObject) => {
        const params: LooseObject = {
            pagetype: 'entityrecord',
            id: contactInfo.id
        }
        if (contactInfo.id === '111') {
            params.id = void 1;
            params.pagetype = 'entitylist'
        }

        if (contactInfo.contactid) {
            params['etn'] = `contact`
        }
        if (contactInfo.accountid) {
            params['etn'] = `account`
        }
        if (contactInfo.leadid) {
            params['etn'] = `lead`
        }
        if (contactInfo.attributesType) {
            params['etn'] = contactInfo.attributesType
        }

        const contactPage: LooseObject = {
            pagetype: 'entityrecord',
            etn: 'contact',
        }

        return contactInfo.id ? `${domain}/main.aspx?${stringify(params)}` : `${domain}/main.aspx?${stringify(contactPage)}`;
    }

    const initCallInfo = useCallback((callNum: string, unCallAction: boolean, callContactInfo: any, direction: string) => {

        getContact({ callNum, user, refresh_token: userConfig.CRMTokenInfo?.refresh_token }).then((contact: LooseObject) => {

            // 是Wave联系人，但不是CRM联系人，不展示信息
            if (!contact.id && callContactInfo) {
                return
            }

            // 需要创建联系人的通话类型
            const createContactBoolean = userConfig.autoCreateConfig?.direction === direction || userConfig.autoCreateConfig?.direction === 'All'

            // 不是Wave联系人，也不是CRM联系人 且配置自动创建联系人
            if (!contact.id && !callContactInfo && userConfig.autoCreate && createContactBoolean) {
                createContact(userConfig, callNum, unCallAction);
                return
            }

            notification(contact, callNum, unCallAction);

        });
    }, [userConfig, user])

    /**
   * 创建新的联系人
   */
    const createContact = (userConfig: LooseObject, callNum: string, unCallAction: boolean) => {
        const userInfoParams = {
            Agent: waveUserInfo.current.userName,
            AgentEmail: waveUserInfo.current.email,
            AgentFirstName: waveUserInfo.current.firstName,
            AgentLastName: waveUserInfo.current.lastName,
            Number: callNum
        }

        const attributesType = userConfig.autoCreateConfig.entityType;

        const firstname = formatDescription(userConfig.autoCreateConfig.firstName, userInfoParams)
        const lastname = formatDescription(userConfig.autoCreateConfig.lastName, userInfoParams)

        const params: any = {
            telephone1: callNum,
        };

        if (attributesType === 'Account') {
            params['name'] = firstname + ' ' + lastname;
        } else {
            params['firstname'] = firstname;
            params['lastname'] = lastname;
        }

        const payload = {
            contactInfo: params,
            attributesType,
        };

        createNewContact(payload).then(contact => {
            contact.displayNotification = true;
            notification(contact, callNum, unCallAction)
        });
    }

    const notification = (contact: LooseObject, callNum: string, unCallAction: boolean) => {
        if (!contact?.displayNotification || !unCallAction && (!callState.current.get(callNum) || !userConfig.notification)) {
            return;
        }
        callNumber.current = callNum;
        const url = getUrl(contact);
        const pluginPath = sessionStorage.getItem("pluginPath");

        // body对象，
        const body: LooseObject = {
            logo: `<div style="margin-bottom: 12px"><img src="${pluginPath}/extend_icon.png" alt=""/> Dynamics 365</div>`,
        }
        if (contact?.id) {
            // 将showConfig重复的删除
            const configList = [...new Set<string>(Object.values(userConfig.notificationConfig))]
            console.log(configList);
            for (const key in configList) {
                console.log(configList[key])
                if (!configList[key]) {
                    continue;
                }

                // 取出联系人的信息用于展示
                let configValue = getValueByConfig(contact, configList[key]);
                console.log(configValue);
                if (configList[key] === 'Phone') {
                    const phone = formatPhoneNumber(callNum);
                    configValue = phone;
                }
                if (configValue) {
                    body[`config_${key}`] = `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;word-break: break-all;text-overflow: ellipsis;">${configValue}</div>`
                }
            }
        }
        else {
            body.phone = `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;word-break: break-all;text-overflow: ellipsis;">${formatPhoneNumber(callNum)}</div>`
        }
        body.action = `<div style="margin-top: 10px;display: flex;justify-content: flex-end;"><button style="background: none; border: none;">
                 <a href=${url} target="_blank" style="color: #62B0FF">
                     ${contact?.id ? formatMessage({ id: 'home.detail' }) : formatMessage({ id: 'home.edit' })}
                 </a>
             </button></div>`;

        console.log("displayNotification");
        // @ts-ignore
        pluginSDK.displayNotification({
            notificationBody: getNotificationBody(body)
        });
    }

    useEffect(() => {
        /**
         * 监听号码
         * 回调函数参数：callType,callNum
         **/
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.onViewCustomerInfos, function ({ phoneNumber }) {
            console.log("onViewCustomerInfos", phoneNumber);
            initCallInfo(phoneNumber, true, undefined, '');
        });

        /**
         * 监听收到语音/视频来电
         * 回调函数参数：callType,callNum
         **/
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.recvP2PIncomingCall, function ({ callType, callNum, callContactInfo }) {
            console.log("onRecvP2PIncomingCall", callType, callNum);
            callState.current.set(callNum, true);
            initCallInfo(callNum, false, callContactInfo, 'Inbound');
        });

        /**
         * 监听wave发起语音/视频
         * 回调函数参数：callType,callNum
         */
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.initP2PCall, function ({ callType, callNum, callContactInfo }) {
            console.log("onInitP2PCall", callType, callNum);
            callState.current.set(callNum, true);
            initCallInfo(callNum, false, callContactInfo, 'Outbound');
        });

        return function cleanup() {
            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.onViewCustomerInfos);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.recvP2PIncomingCall);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.initP2PCall);
        }
    }, [initCallInfo])

    useEffect(() => {
        /**
         * 监听拒绝语音/视频
         * 回调函数参数：callType,callNum
         */
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.rejectP2PCall, function ({ callType, callNum }) {
            console.log("onRejectP2PCall", callType, callNum);
            uploadCallInfo(callNum, 0, 0, WAVE_CALL_TYPE.in);
            console.log("hideNotification, callNum, callState", callNum, callState);
            callState.current.set(callNum, false);
            if (callNumber.current === callNum) {
                // @ts-ignore
                pluginSDK.hideNotification();
            }
        });

        /**
         * 监听挂断语音/视频
         * 回调函数参数：callType,callNum
         */
        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.hangupP2PCall, function (data) {
            console.log("onHangupP2PCall", data);
            let { callNum, callStartTimeStamp, callEndTimeStamp, callDirection } = data;
            callDirection = callDirection === "in" ? WAVE_CALL_TYPE.in : WAVE_CALL_TYPE.out;
            uploadCallInfo(callNum, callStartTimeStamp ?? 0, callEndTimeStamp ?? 0, callDirection);
            console.log("hideNotification, callNum, callState", callNum, callState);
            callState.current.set(callNum, false);
            if (callNumber.current === callNum) {
                // @ts-ignore
                pluginSDK.hideNotification();
            }
        });

        // @ts-ignore
        pluginSDK.eventEmitter.on(EVENT_KEY.p2PCallCanceled, function ({ callType, callNum }) {
            console.log("p2PCallCanceled", callType, callNum);
            uploadCallInfo(callNum, 0, 0, WAVE_CALL_TYPE.miss);
            console.log("hideNotification, callNum, callState", callNum, callState);
            callState.current.set(callNum, false);
            if (callNumber.current === callNum) {
                // @ts-ignore
                pluginSDK.hideNotification();
            }
        });

        return function cleanup() {
            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.rejectP2PCall);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.hangupP2PCall);

            // @ts-ignore
            pluginSDK.eventEmitter.off(EVENT_KEY.p2PCallCanceled);

        };

    }, [uploadCallInfo]);

    useEffect(() => {
        return function closeNotification() {
            // @ts-ignore
            pluginSDK.hideNotification();
        }
    }, [])

    useEffect(() => {
        // @ts-ignore
        pluginSDK.contact.getMe(({ data }) => {
            console.log('getMe', data);
            if (!data) {
                return
            }
            waveUserInfo.current = data;
        })
    }, [])

    return (<></>)
}

export default connect(
    ({ global }: { global: GlobalModelState }) => ({
        userConfig: global.userConfig,
        user: global.user,
    }),
    (dispatch: Dispatch) => ({
        getContact: (payload: LooseObject) => dispatch({
            type: 'home/getContact',
            payload,
        }),
        putCallInfo: (payload: LooseObject) => dispatch({
            type: 'home/putCallInfo',
            payload
        }),
        createNewContact: (payload: LooseObject) => dispatch({
            type: "home/createNewContact",
            payload
        }),
    })
)(IndexPage);