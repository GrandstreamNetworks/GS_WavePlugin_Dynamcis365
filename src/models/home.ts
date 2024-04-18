import { CLIENT_CONFIG, CREATION_CONFIG_CONTACT_TYPE_DEF, REQUEST_CODE, SESSION_STORAGE_KEY } from '@/constant';
import { createNewAccount, createNewContact, createNewLead, getAccount, getContact, getLead, getMysystemUserId, putCallInfo } from '@/services/home';
import { get } from 'lodash';
import { Effect, Reducer } from 'umi';

export interface HomeModelState {
}

export interface HomeModelType {
    namespace: string
    state: HomeModelState
    effects: {
        getContact: Effect
        putCallInfo: Effect
        createNewContact: Effect
    }
    reducers: {
        save: Reducer<HomeModelState>
    }
}

const HomeModal: HomeModelType = {
    namespace: 'home',
    state: {},

    effects: {
        * getContact({ payload }, { call, put }): any {
            const { refresh_token, user, callNum } = payload;
            let res = yield call(getContact, callNum);
            if (res?.status === REQUEST_CODE.noAuthority || res?.code === REQUEST_CODE.noAuthority) {
                const getToken = yield put({
                    type: 'global/refreshToken',
                    payload: {
                        grant_type: "refresh_token",
                        refresh_token: refresh_token,
                        client_id: CLIENT_CONFIG.client_id,
                        state: SESSION_STORAGE_KEY.CRMToken
                    }
                });
                yield call(() => getToken);
                res = yield call(getContact, callNum);
            }
            // 异常判断
            let connectState = res?.code || 'SUCCESS';
            if (res.value?.length <= 0) {
                res = yield call(getAccount, callNum);
            }
            if (res.value?.length <= 0) {
                res = yield call(getLead, callNum);
            }
            yield put({ type: 'global/save', payload: { connectState } })
            const system = yield call(getMysystemUserId, user);
            const contactInfo = get(res, ['value', 0]) || {};
            contactInfo.id = contactInfo.contactid || contactInfo.accountid || contactInfo.leadid;
            contactInfo.displayNotification = connectState === 'SUCCESS';
            contactInfo.systemUserId = get(system, ['value', 0, 'systemuserid']);
            if (contactInfo.contactid) {
                contactInfo.module = 'Contact';
            }
            if (contactInfo.accountid) {
                contactInfo.module = 'Account';
            }
            if (contactInfo.leadid) {
                contactInfo.module = 'Lead';
            }
            return contactInfo;
        },

        * putCallInfo({ payload }, { call, put }): any {
            const res = yield call(putCallInfo, payload);
            let connectState = res?.code || 'SUCCESS';
            yield put({ type: 'global/save', payload: { connectState, } })
            return res;
        },

        *createNewContact({ payload }, { call, put }): any {
            const { contactInfo, attributesType } = payload;
            switch (attributesType) {
                case 'Lead':
                    yield call(createNewLead, contactInfo);
                    break
                case 'Account':
                    yield call(createNewAccount, contactInfo);
                    break
                default:
                    yield call(createNewContact, contactInfo);
                    break
            }
            return {
                id: '111',
                ...contactInfo,
                attributesType: CREATION_CONFIG_CONTACT_TYPE_DEF[attributesType],
                fullname: contactInfo.name ? void 1 : contactInfo.firstname + ' ' + contactInfo.lastname,
            }
        }
    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload }
        }
    }
}

export default HomeModal;
