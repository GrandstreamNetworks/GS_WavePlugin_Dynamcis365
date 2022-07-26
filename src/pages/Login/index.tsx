import React, { useEffect, useState } from "react";
import { Form, Input, Button, Checkbox, Image } from 'antd';
import { connect, Dispatch, Loading, useIntl, history } from 'umi';
import { get } from 'lodash'
import { Footer } from '@/components';
import { CLIENT_CONFIG, REQUEST_CODE, SESSION_STORAGE_KEY } from '@/constant';
import UserIcon from '@/asset/login/account-line.svg';
import styles from './index.less';
import { setToken } from '@/utils/utils';


interface LoginProps {
    login: (obj: LooseObject) => void
    getUser: () => Promise<LooseObject>
    saveUserConfig: (obj: LooseObject) => void
    save: (obj: LooseObject) => void
    loginLoading: boolean | undefined
}

const Login: React.FC<LoginProps> = ({ login, getUser, saveUserConfig, save, loginLoading = false }) => {
    const [form] = Form.useForm();
    const [errorMessage, setErrorMessage] = useState<string>('');
    const { formatMessage } = useIntl();

    const onfocus = () => {
        setErrorMessage('');
    }

    const getUserInfo = (userConfig: any) => {
        console.log("getUserInfo")
        getUser().then(res => {
            if (res?.code === REQUEST_CODE.connectError) {
                setErrorMessage('error.network');
                return;
            }
            if (res?.status || res?.error) {
                setErrorMessage('error.message');
                return;
            }
            if (res.id) {
                const config = {
                    ...userConfig,
                    uploadCall: userConfig.uploadCall ?? true,
                    showConfig: userConfig.showConfig ?? {
                        first: 'Name',
                        second: 'Phone',
                        third: 'None',
                        forth: 'None',
                        fifth: 'None',
                    }
                }
                save({
                    uploadCall: userConfig.uploadCall ?? true,
                    showConfig: userConfig.showConfig ?? {
                        first: 'Name',
                        second: 'Phone',
                        third: 'None',
                        forth: 'None',
                        fifth: 'None',
                    }
                })
                saveUserConfig(config);
                history.replace('home')
                return;
            }
            console.log(res);
        })
        console.log(userConfig);
    }

    const toLogin = (values: { domain: string }) => {
        if (!values.domain) {
            setErrorMessage('error.message');
            return;
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY.domain, values.domain)
        console.log("login", values);
        login({
            scope: CLIENT_CONFIG.scope,
            state: SESSION_STORAGE_KEY.userToken
        });
    }

    const toLoginHome = () => {
        const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain)
        login({
            scope: `${domain}/user_impersonation`,
            state: SESSION_STORAGE_KEY.CRMToken,
        });
    }

    const getUserConfig = (login?: boolean) => {
        console.log("getUserConfig", login);
        // 获取保存的信息
        // @ts-ignore
        pluginSDK.userConfig.getUserConfig(function ({ errorCode, data, }: { errorCode: number, data: string }) {
            console.log(errorCode, data);
            if (errorCode === 0 && data) {
                const userConfig = JSON.parse(data);
                const domain = userConfig.domain || sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
                form.setFieldsValue({ domain })
                if (login) {
                    getUserInfo({ ...userConfig, domain });
                    return;
                }
                domain && toLogin({ domain: userConfig.domain });
            }
            if (login) {
                const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
                getUserInfo({ domain });
                return;
            }
        });
    }

    const getCode = () => {
        const token = setToken();
        console.log("token", token);
        if (!get(token, 'access_token') && !get(token, 'error')) {
            getUserConfig();
            return;
        }
        if (token.state === SESSION_STORAGE_KEY.userToken) {
            toLoginHome();
            return;
        }
        getUserConfig(true);
    }

    useEffect(() => {
        getCode();
    }, [])

    return (
        <>
            {errorMessage && <div className={styles.errorDiv}>
                <div className={styles.errorMessage}>{formatMessage({ id: errorMessage })}</div>
            </div>}
            <div className={styles.homePage}>
                <Form
                    className={styles.form}
                    form={form}
                    layout="vertical"
                    onFinish={toLogin}
                    onFocus={onfocus}
                >
                    <div className={styles.formContent}>
                        <Form.Item
                            name="domain"
                            rules={[{
                                required: true, message: formatMessage({ id: 'login.domain.error' })
                            }]}
                        >
                            <Input placeholder={formatMessage({ id: 'login.domain' })}
                                prefix={<Image src={UserIcon} preview={false} />} />
                        </Form.Item>
                    </div>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loginLoading}>
                            {formatMessage({ id: 'login.submit.btn' })}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            <Footer url="https://documentation.grandstream.com/knowledge-base/wave-crm-add-ins/#overview"
                message={formatMessage({ id: 'login.user.guide' })} />
        </>
    );
}

export default connect(
    ({ loading }: { loading: Loading }) => ({
        loginLoading: loading.effects['global/getUser']
    }),
    (dispatch: Dispatch) => ({
        login: (payload: LooseObject) => dispatch({
            type: 'global/login',
            payload,
        }),
        getUser: () => dispatch({
            type: 'global/getUser',
        }),
        saveUserConfig: (payload: LooseObject) => dispatch({
            type: 'global/saveUserConfig',
            payload
        }),
        save: (payload: LooseObject) => dispatch({
            type: 'global/save',
            payload
        }),
    })
)(Login);