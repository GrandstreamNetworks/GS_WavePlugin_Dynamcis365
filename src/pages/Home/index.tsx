import React, { useCallback, useEffect } from 'react'
import { connect, Dispatch, GlobalModelState, useIntl } from 'umi'
import moment from "moment";
import { stringify } from "qs";
import { CallAction, ConfigBlock, ConnectError, ConnectState, Footer, ReLogin } from '@/components'
import { getNotificationBody, getValueByConfig, setToken } from '@/utils/utils';
import { DATE_FORMAT, SESSION_STORAGE_KEY } from "@/constant";
import styles from './index.less'


interface IndexProps {
    getContact: (obj: LooseObject) => Promise<LooseObject>
    putCallInfo: (obj: LooseObject) => Promise<LooseObject>
    showConfig: ShowConfig
    uploadCall: boolean
    user: LooseObject
    callState: Map<string, boolean>
}

const Index: React.FC<IndexProps> = ({ getContact, putCallInfo, showConfig, uploadCall, user, callState }) => {

    const { formatMessage } = useIntl();

    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);

    const uploadCallInfo = useCallback((callNum: string, callStartTimeStamp: number, callEndTimeStamp: number, callDirection: boolean) => {
        if (!uploadCall) {
            return;
        }
        callNum = callNum.replace(/\b(0+)/gi, '');
        getContact({ callNum, user }).then(contactInfo => {
            if (!contactInfo?.id) {
                return;
            }
            const duration = callEndTimeStamp - callStartTimeStamp;
            const duration_minutes = moment.duration(duration).hours() * 60 + moment.duration(duration).minutes()

            const toParty: LooseObject = {
                participationtypemask: callDirection ? 2 : 1,
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
                subject: `${contactInfo.fullname || contactInfo.name || 'new'} 's call.`,
                statecode: 1,
                prioritycode: 1,
                actualstart: `${moment(callStartTimeStamp || undefined).format(DATE_FORMAT.format_4)}Z`,
                actualend: `${moment(callEndTimeStamp || undefined).format(DATE_FORMAT.format_4)}Z`,
                actualdurationminutes: duration_minutes,
                directioncode: callDirection,
                phonenumber: callNum,
                phonecall_activity_parties: [
                    {
                        participationtypemask: callDirection ? 1 : 2,
                        'partyid_systemuser@odata.bind': `/systemusers(${contactInfo.systemUserId})`
                    },
                    toParty
                ]
            }

            putCallInfo(data).then(res => {
                console.log('putCallInfo:', data, res);
            });
        })

    }, [uploadCall, user]);

    const getUrl = (contactInfo: LooseObject) => {
        const params: LooseObject = {
            forceUCI: 1,
            pagetype: 'entityrecord',
            id: contactInfo.id
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

        const contactPage: LooseObject = {
            pagetype: 'entitylist',
            etn: 'contact',
        }

        return contactInfo.id ? `${domain}/main.aspx?${stringify(params)}` : `${domain}/main.aspx?${stringify(contactPage)}`;
    }

    const initCallInfo = useCallback((callNum: string) => {
        // callNum 去除前面的0
        callNum = callNum.replace(/\b(0+)/gi, "");
        getContact({ callNum, user }).then((contact: LooseObject) => {
            console.log("callState", callState);
            if (!contact?.displayNotification || !callState.get(callNum)) {
                return;
            }
            const url = getUrl(contact);
            const pluginPath = sessionStorage.getItem("pluginPath");

            // body对象，
            const body: LooseObject = {
                logo: `<div style="margin-bottom: 12px"><img src="${pluginPath}/logo.png" alt=""/> Dynamics 365</div>`,
            }
            if (contact?.id) {
                // 将showConfig重复的删除
                const configList = [...new Set<string>(Object.values(showConfig))]
                console.log(configList);
                for (const key in configList) {
                    console.log(configList[key])
                    if (!configList[key]) {
                        continue;
                    }

                    // 取出联系人的信息用于展示
                    const configValue = getValueByConfig(contact, configList[key]);
                    console.log(configValue);
                    if (configList[key] === 'Phone') {
                        body[`config_${key}`] = `<div style="font-weight: bold">${callNum}</div>`
                    }
                    else if (configValue) {
                        body[`config_${key}`] = `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;word-break: break-all;text-overflow: ellipsis;">${configValue}</div>`
                    }
                }
            }
            else {
                body.phone = `<div style="font-weight: bold;">${callNum}</div>`
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
        });
    }, [showConfig, user, callState])

    useEffect(() => {
        console.log(window.location);
        setToken();
    }, [])

    return (
        <>
            <ReLogin />
            <CallAction initCallInfo={initCallInfo} uploadCallInfo={uploadCallInfo} />
            <ConnectError />
            <div className={styles.homePage}>
                <ConnectState />
                <ConfigBlock />
            </div>
            <Footer url={`${domain}/main.aspx`}
                message={formatMessage({ id: "home.toCRM" })} />
        </>
    );
}

export default connect(
    ({ global }: { global: GlobalModelState }) => ({
        showConfig: global.showConfig,
        uploadCall: global.uploadCall,
        user: global.user,
        callState: global.callState,
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
    })
)(Index);