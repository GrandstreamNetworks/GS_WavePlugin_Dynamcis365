import { ConfigBlock, ConnectError, ConnectState, Footer } from '@/components';
import { SESSION_STORAGE_KEY } from "@/constant";
import { setToken } from '@/utils/utils';
import { useEffect } from 'react';
import { useIntl } from 'umi';
import styles from './index.less';

const Index = () => {

    const { formatMessage } = useIntl();

    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);

    useEffect(() => {
        console.log(window.location);
        setToken();
    }, [])

    return (
        <>
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

export default Index;