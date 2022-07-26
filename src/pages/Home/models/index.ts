import { Effect, Reducer } from 'umi';
import { get } from 'lodash';
import { getAccount, getContact, getLead, getMysystemUserId, putCallInfo } from '../services';

export interface HomeModelState {
}

export interface HomeModelType {
    namespace: string
    state: HomeModelState
    effects: {
        getContact: Effect
        putCallInfo: Effect
    }
    reducers: {
        save: Reducer<HomeModelState>
    }
}

const HomeModal: HomeModelType = {
    namespace: 'home',
    state: {},

    effects: {
        * getContact({ payload }, { call, put }) {
            let res = yield call(getContact, payload.callNum);
            // 异常判断
            let connectState = res?.code || 'SUCCESS';
            if (res.value?.length <= 0) {
                res = yield call(getAccount, payload.callNum);
            }
            if (res.value?.length <= 0) {
                res = yield call(getLead, payload.callNum);
            }
            yield put({ type: 'global/save', payload: { connectState } })
            const system = yield call(getMysystemUserId, payload.user);
            const contactInfo = get(res, ['value', 0]) || {};
            contactInfo.id = contactInfo.contactid || contactInfo.accountid || contactInfo.leadid;
            contactInfo.displayNotification = connectState === 'SUCCESS';
            contactInfo.systemUserId = get(system, ['value', 0, 'systemuserid']);
            return contactInfo;
        },

        * putCallInfo({ payload }, { call, put }) {
            const res = yield call(putCallInfo, payload);
            let connectState = res?.code || 'SUCCESS';
            yield put({ type: 'global/save', payload: { connectState, } })
            return res;
        }
    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload }
        }
    }
}

export default HomeModal;
