import { stringify } from 'qs';
import { Effect, Reducer } from 'umi';
import { getUser } from '@/services/global';
import { CLIENT_CONFIG, SESSION_STORAGE_KEY } from '@/constant';

export interface GlobalModelState {
    user: LooseObject,
    userConfig: LooseObject
    connectState: string
    uploadCall: boolean
    showConfig: LooseObject
    callState: Map<string, boolean>
}

export interface GlobalModelType {
    namespace: 'global'
    state: GlobalModelState
    effects: {
        login: Effect
        logout: Effect
        getUser: Effect
        uploadCallChange: Effect
        saveShowConfig: Effect
        saveUserConfig: Effect
    }
    reducers: {
        save: Reducer<GlobalModelState>
    }
}

const GlobalModal: GlobalModelType = {
    namespace: 'global',
    state: {
        user: {},
        userConfig: {},
        connectState: 'SUCCESS',
        uploadCall: true,
        showConfig: {},
        callState: new Map(),
    },

    effects: {
        * login({ payload }) {
            console.log("login", payload);
            const data = {
                interceptField: CLIENT_CONFIG.redirect_uri,
                hash: '#/login'
            }

            // 向Wave注册重定向监听
            // @ts-ignore
            yield pluginSDK.setPluginURLInterceptor(data);

            const params = {
                ...CLIENT_CONFIG,
                scope: payload.scope,
                state: payload.state,
            };
            window.location.replace(`https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize?${stringify(params)}`);
        },

        * getUser(_, { call, put }) {
            const user = yield call(getUser);
            let connectState = user?.code || 'SUCCESS';
            if (user.id) {
                yield put({
                    type: 'save',
                    payload: {
                        user,
                        connectState,
                    },
                });
                return user
            }
            yield put({
                type: 'save',
                payload: {
                    connectState,
                }
            })
            return user;
        },

        * logout(_, { put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            userConfig.domain = undefined;
            userConfig.showConfig = undefined;
            yield put({
                type: 'saveUserConfig',
                payload: userConfig
            });
            sessionStorage.removeItem(SESSION_STORAGE_KEY.domain);
            //@ts-ignore
            yield pluginSDK.clearCookie({ origin: 'https://login.microsoftonline.com' }, function () { });
            window.location.replace(`https://login.microsoftonline.com/${CLIENT_CONFIG.tenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${CLIENT_CONFIG.redirect_uri}`);
        },

        * uploadCallChange({ payload }, { put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            userConfig.uploadCall = payload;
            yield put({
                type: 'saveUserConfig',
                payload: userConfig,
            })
            yield put({
                type: 'save',
                payload: {
                    uploadCall: payload,
                }
            })
        },

        * saveShowConfig({ payload }, { put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            console.log(userConfig);
            userConfig.showConfig = payload;
            yield put({
                type: 'saveUserConfig',
                payload: userConfig,
            })
            yield put({
                type: 'save',
                payload: {
                    showConfig: payload,
                }
            })
        },

        * saveUserConfig({ payload }, { put }) {
            console.log(payload);
            // @ts-ignore
            pluginSDK.userConfig.addUserConfig({ userConfig: JSON.stringify(payload) }, function ({ errorCode }: { errorCode: number }) {
                console.log(errorCode);
            })
            yield put({
                type: 'save',
                payload: {
                    userConfig: payload
                },
            })
        }

    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
}

export default GlobalModal;