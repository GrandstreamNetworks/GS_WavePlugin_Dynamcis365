import React, { useEffect, useState } from 'react';
import { history } from "umi";
import { SESSION_STORAGE_KEY } from "@/constant";

const ReLogin = () => {

    const [time, setTime] = useState<number>(-1);

    useEffect(() => {
        const userTokenExpiresIn = Number(sessionStorage.getItem(SESSION_STORAGE_KEY.userToken + 'expires_in')) || -1;
        const CRMTokenExpiresIn = Number(sessionStorage.getItem(SESSION_STORAGE_KEY.CRMToken + 'expires_in')) || -1;
        console.log("userTokenExpiresIn", userTokenExpiresIn);
        console.log("CRMTokenExpiresIn", CRMTokenExpiresIn);
        setTime(Math.min(userTokenExpiresIn, CRMTokenExpiresIn));
    }, [])

    useEffect(() => {
        if (time === 0) {
            const href = window.location.href.split('?')[0];
            window.history.replaceState('', '', `${href}/#/home`);
            history.replace('login');
            return;
        }
        if (time > 0) {
            setTimeout(() => {
                setTime(time => time - 1);
            },1000)
            return;
        }
    }, [time])

    return (<></>);
}

export default ReLogin;