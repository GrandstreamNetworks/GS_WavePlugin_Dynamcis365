import DownIcon from '@/asset/login/down.svg';
import { Footer } from '@/components';
import { AUTO_CREATE_CONFIG_DEF, CLIENT_CONFIG, NOTIFICATION_CONFIG_DEF, SESSION_STORAGE_KEY, UPLOAD_CALL_CONFIG_DEF } from '@/constant';
import { setToken } from '@/utils/utils';
import { Button, Form, Image, Input } from 'antd';
import { get } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Dispatch, Loading, connect, history, useIntl } from 'umi';
import Domain from '../../asset/login/service-line.svg';
import styles from './index.less';

interface LoginProps {
    login: (obj: LooseObject) => void;
    getUser: (obj: LooseObject) => Promise<LooseObject>;
    saveUserConfig: (obj: LooseObject) => void;
    token: (obj: LooseObject) => Promise<LooseObject>
    loginLoading: boolean | undefined;
}

const Login: React.FC<LoginProps> = ({
    login,
    getUser,
    saveUserConfig,
    token,
    loginLoading = false,
}) => {
    const [form] = Form.useForm();
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [domains, setDomains] = useState<string[]>([]);
    const [domainShow, setDomainShow] = useState<boolean>(false);
    const { formatMessage } = useIntl();

    const onfocus = () => {
        setErrorMessage('');
    };

    const closeList = () => {
        setDomainShow(false);
    };

    const showDomainList = (event: { stopPropagation: () => void }) => {
        setDomainShow(true);
        event.stopPropagation();
    };
    const setDomain = (item: string) => {
        form.setFieldsValue({ domain: item });
        closeList();
    };

    const getUserInfo = (userConfig: any) => {
        console.log('getUserInfo');
        getUser({
            userRefreshToken: userConfig.userTokenInfo?.refresh_token,
            CRMRefreshToken: userConfig.CRMTokenInfo?.refresh_token,
        }).then((res) => {
            if (res.error) {
                setErrorMessage(res.error);
                return;
            }
            if (res.id) {
                const newConfig = {
                    ...userConfig,
                    autoLogin: true,
                    uploadCall: userConfig.uploadCall ?? true,
                    notification: userConfig.notification ?? true,
                    autoCreate: userConfig.autoCreate ?? false,
                    autoCreateConfig: userConfig.autoCreateConfig ?? AUTO_CREATE_CONFIG_DEF,
                    uploadCallConfig: userConfig.uploadCallConfig ?? UPLOAD_CALL_CONFIG_DEF,
                    notificationConfig: userConfig.notificationConfig ?? NOTIFICATION_CONFIG_DEF,
                };
                saveUserConfig(newConfig);
                history.replace('home');
                return;
            }
            console.log(res);
        });
        console.log(userConfig);
    };

    const toLogin = (values: any) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY.domain, values.domain);
        sessionStorage.setItem('login', '1');
        login({
            scope: CLIENT_CONFIG.scope,
            state: SESSION_STORAGE_KEY.userTokenInfo,
        });
    };

    const toLoginHome = () => {
        const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
        login({
            scope: `${domain}/user_impersonation offline_access`,
            state: SESSION_STORAGE_KEY.CRMTokenInfo,
        });
    };

    const getUserConfig = () => {
        console.log('getUserConfig');
        // 获取保存的信息
        // @ts-ignore
        pluginSDK.userConfig.getUserConfig(function ({ errorCode, data }) {
            if (errorCode === 0 && data) {
                const userConfig = JSON.parse(data);
                console.log(userConfig);
                const sessionDomain = sessionStorage.getItem(
                    SESSION_STORAGE_KEY.domain,
                );
                let domain = userConfig.domain || [];
                if (typeof domain === 'string') {
                    domain = [domain];
                }
                if (sessionDomain) {
                    domain.unshift(sessionDomain);
                    domain = [...new Set(domain)];
                }
                else {
                    sessionStorage.setItem(SESSION_STORAGE_KEY.domain, domain[0]);
                }
                setDomains(domain);

                const loginParams: any = {
                    domain: domain[0],
                };
                form.setFieldsValue(loginParams);

                // 已登录的与预装配置进行对比
                let sameConfig = true;

                // 有预装配置 走预装配置
                const preParamObjectStr = sessionStorage.getItem('preParamObject');
                if (preParamObjectStr) {
                    const preParamObject = JSON.parse(
                        sessionStorage.getItem('preParamObject') || '',
                    );
                    if (preParamObject) {
                        const formParams: any = {};
                        Object.keys(preParamObject).forEach((item) => {
                            Object.keys(loginParams).forEach((element) => {
                                if (item.toLowerCase() === element.toLowerCase()) {
                                    formParams[element] = preParamObject[item];
                                    if (!sameConfig) {
                                        return;
                                    }
                                    sameConfig = preParamObject[item] === loginParams[item.toLowerCase()];
                                }
                            });
                        });
                        form.setFieldsValue({ ...formParams });
                    }
                }

                const CRMToken = userConfig.CRMTokenInfo;
                const userToken = userConfig.userTokenInfo;

                const sessionCRMToken = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY.CRMTokenInfo) || '{}');
                const sessionUserToken = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY.userTokenInfo) || '{}');

                const CRMTokenInfo = sessionCRMToken.access_token ? sessionCRMToken : CRMToken;
                const userTokenInfo = sessionUserToken.access_token ? sessionUserToken : userToken;

                sessionStorage.setItem(SESSION_STORAGE_KEY.CRMToken, CRMTokenInfo?.access_token);
                sessionStorage.setItem(SESSION_STORAGE_KEY.userToken, userTokenInfo?.access_token);

                const login = sessionStorage.getItem('login');
                if ((userConfig.autoLogin || login) && sameConfig) {
                    getUserInfo({ ...userConfig, CRMTokenInfo, userTokenInfo, domain });
                    return;
                }
                return;
            }
            else {
                const loginParams: any = { domain: '' };
                // 有预装配置 走预装配置
                const preParamObjectStr = sessionStorage.getItem('preParamObject');
                if (preParamObjectStr) {
                    const preParamObject = JSON.parse(preParamObjectStr);
                    if (preParamObject) {
                        Object.keys(preParamObject).forEach((item) => {
                            Object.keys(loginParams).forEach((element) => {
                                if (item.toLowerCase() === element.toLowerCase()) {
                                    loginParams[element] = preParamObject[item];
                                }
                            });
                        });
                        form.setFieldsValue({ ...loginParams });
                    }
                }

                const CRMTokenInfo = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY.CRMTokenInfo) || '{}');
                const userTokenInfo = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY.userTokenInfo) || '{}');

                sessionStorage.setItem(SESSION_STORAGE_KEY.CRMToken, CRMTokenInfo?.access_token);
                sessionStorage.setItem(SESSION_STORAGE_KEY.userToken, userTokenInfo?.access_token);
                const sessionDomain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain) || '';

                sessionDomain && setDomains(item => [...item, sessionDomain]);

                const login = sessionStorage.getItem('login');
                if (login) {
                    getUserInfo({ CRMTokenInfo, userTokenInfo, domain: [sessionDomain] });
                    return;
                }
            }
        });
    };

    const getTokenByCode = (tokenInfo: LooseObject) => {
        const params = {
            code: tokenInfo.code,
            client_id: CLIENT_CONFIG.client_id,
            redirect_uri: CLIENT_CONFIG.redirect_uri,
            response_mode: 'fragment',
            grant_type: 'authorization_code',
        }
        return token(params).then((res: LooseObject) => {
            console.log('token', res);
            if (res.error) {
                setErrorMessage(res.error);
                return;
            }
            if (res.access_token) {
                sessionStorage.setItem(tokenInfo.state, JSON.stringify(res));
                if (tokenInfo.state === SESSION_STORAGE_KEY.userTokenInfo) {
                    toLoginHome();
                }
                return;
            }
            setErrorMessage('login.error');
        })
    }

    const getCode = () => {
        const tokenInfo = setToken();
        console.log('token', tokenInfo);
        if (tokenInfo.code) {
            const sessionDomain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain) || '';
            setDomain(sessionDomain)
            getTokenByCode(tokenInfo).then(() => {
                if (tokenInfo.state === SESSION_STORAGE_KEY.CRMTokenInfo) {
                    getUserConfig()
                    return;
                }
            })
            return
        }
        if (get(tokenInfo, 'error')) {
            return;
        }
        getUserConfig();
    };

    useEffect(() => {
        getCode();
    }, []);

    return (
        <>
            {errorMessage && (
                <div className={styles.errorDiv}>
                    <div className={styles.errorMessage}>
                        {formatMessage({ id: errorMessage })}
                    </div>
                </div>
            )}
            <div className={styles.homePage} onClick={closeList} >
                <Form
                    className={styles.form}
                    form={form}
                    layout="vertical"
                    onFinish={toLogin}
                    onFocus={onfocus}
                >
                    <div className={styles.formContent}>
                        <div className={styles.clientId}>
                            <Form.Item
                                name="domain"
                                rules={[
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'login.domain.error' }),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={formatMessage({ id: 'login.domain' })}
                                    prefix={<Image src={Domain} preview={false} />}
                                    suffix={
                                        domains.length > 0 && (
                                            <Image
                                                src={DownIcon}
                                                className={styles.downIcon}
                                                preview={false}
                                                onClick={showDomainList}
                                            />
                                        )
                                    }
                                />
                            </Form.Item>
                            <div
                                className={styles.clientIdList}
                                hidden={!domainShow || domains.length <= 0}
                            >
                                <div className={styles.clientIdListContent}>
                                    {domains.map((item: string) => (
                                        <div
                                            key={item}
                                            onClick={() => setDomain(item)}
                                            className={styles.clientIdItem}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loginLoading}>
                            {formatMessage({ id: 'login.submit.btn' })}
                        </Button>
                    </Form.Item>
                </Form>
            </div >
            <Footer
                url="https://documentation.grandstream.com/knowledge-base/wave-crm-add-ins/#overview"
                message={formatMessage({ id: 'login.user.guide' })}
            />
        </>
    );
};

export default connect(
    ({ loading }: { loading: Loading }) => ({
        loginLoading: loading.effects['global/getUser'] || loading.effects['global/login'] || loading.effects['global/token']
    }),
    (dispatch: Dispatch) => ({
        login: (payload: LooseObject) => dispatch({
            type: 'global/login',
            payload,
        }),
        getUser: (payload: LooseObject) => dispatch({
            type: 'global/getUser',
            payload
        }),
        saveUserConfig: (payload: LooseObject) => dispatch({
            type: 'global/saveUserConfig',
            payload,
        }),
        token: (payload: LooseObject) => dispatch({
            type: 'global/token',
            payload,
        })
    }),
)(Login);
