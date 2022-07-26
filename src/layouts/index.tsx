import React from "react";
import { ConnectProps } from 'umi';

interface LayoutProps extends ConnectProps {

}

const Layouts: React.FC<LayoutProps> = ({ children }) => {
    return (
        <>
            {children}
        </>
    )
}

export default Layouts;