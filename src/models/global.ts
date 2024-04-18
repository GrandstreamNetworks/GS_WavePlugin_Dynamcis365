import { CLIENT_CONFIG, MICROSOFT_LOGIN_SERVER_ADDRESS, SESSION_STORAGE_KEY } from '@/constant';
import { checkDomain, getUser, token } from '@/services/global';
import { stringify } from 'qs';
import { Effect, Reducer } from 'umi';

export interface GlobalModelState {
    user: LooseObject,
    userConfig: LooseObject
    connectState: string
}

export interface GlobalModelType {
    namespace: 'global'
    state: GlobalModelState
    effects: {
        login: Effect
        token: Effect
        refreshToken: Effect
        logout: Effect
        getUser: Effect
        userConfigChange: Effect
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
            window.location.replace(`${MICROSOFT_LOGIN_SERVER_ADDRESS}/organizations/oauth2/v2.0/authorize?${stringify(params)}`);
        },

        * token({ payload }, { call }): any {
            return yield call(token, payload);
        },

        * refreshToken({ payload }, { call }): any {
            const res = yield call(token, payload);
            sessionStorage.setItem(payload.state, res.access_token);
        },

        * getUser({ payload }, { call, put }): any {
            let res = yield call(checkDomain);
            console.log(res);
            if (res?.status === 403 || res?.status === 401) {
                const getToken = yield put({
                    type: 'global/refreshToken',
                    payload: {
                        grant_type: "refresh_token",
                        refresh_token: payload.CRMRefreshToken,
                        client_id: CLIENT_CONFIG.client_id,
                        state: SESSION_STORAGE_KEY.CRMToken
                    }
                });
                yield call(() => getToken);
                res = yield call(checkDomain);
            }
            if (res?.code || res?.status || res?.error) {
                let connectState = res?.code || 'SUCCESS';
                yield put({
                    type: 'save',
                    payload: {
                        connectState,
                    },
                });
                return {
                    error: 'error.message'
                }
            }
            let user = yield call(getUser);
            if (user?.status === 403 || user?.status === 401) {
                const getToken = yield put({
                    type: 'global/refreshToken',
                    payload: {
                        grant_type: "refresh_token",
                        refresh_token: payload.userRefreshToken,
                        client_id: CLIENT_CONFIG.client_id,
                        state: SESSION_STORAGE_KEY.userToken
                    }
                });
                yield call(() => getToken);
                user = yield call(getUser);
            }
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
            userConfig.autoLogin = false;
            yield put({
                type: 'saveUserConfig',
                payload: userConfig
            });
            sessionStorage.removeItem('login');
            //@ts-ignore
            yield pluginSDK.clearCookie({ origin: 'https://login.microsoftonline.com' }, function () { });

            // window.location.replace(`https://login.microsoftonline.com/organizations/oauth2/v2.0/logout?post_logout_redirect_uri=${CLIENT_CONFIG.redirect_uri}`);
            var url = new URL(window.location.href);
            url.search = '';
            url.hash = '#/login';
            window.location.href = url.toString()
        },

        * userConfigChange({ payload }, { put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            const newConfig = {
                ...userConfig,
                ...payload,
            }
            yield put({
                type: 'saveUserConfig',
                payload: newConfig,
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