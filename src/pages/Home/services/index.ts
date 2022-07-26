import request from "@/utils/request";
import { SESSION_STORAGE_KEY } from "@/constant";
import { stringify } from "qs";

export const getContact = (callNumber: string) => {
    const params = {
        $filter: `contains(managerphone,'${callNumber}')
        or contains(mobilephone,'${callNumber}')
        or contains(telephone1,'${callNumber}')
        or contains(telephone2,'${callNumber}')
        or contains(telephone3,'${callNumber}')
        or contains(assistantphone,'${callNumber}')
        or contains(company,'${callNumber}')
        or contains(business2,'${callNumber}')
        or contains(address1_telephone1,'${callNumber}')
        or contains(address1_telephone2,'${callNumber}')
        or contains(address1_telephone3,'${callNumber}')
        or contains(address2_telephone1,'${callNumber}')
        or contains(address2_telephone2,'${callNumber}')
        or contains(address2_telephone3,'${callNumber}')
        or contains(address3_telephone1,'${callNumber}')
        or contains(address3_telephone2,'${callNumber}')
        or contains(address3_telephone3,'${callNumber}')
        `,
        $top: 1
    }
    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
    return request(`${domain}/api/data/v9.2/contacts?${stringify(params)}`);
}

export const getAccount = (callNumber: string) => {
    const params = {
        $filter: `contains(address1_telephone1,'${callNumber}')
        or contains(address1_telephone2,'${callNumber}')
        or contains(address1_telephone3,'${callNumber}')
        or contains(address2_telephone1,'${callNumber}')
        or contains(address2_telephone2,'${callNumber}')
        or contains(address2_telephone3,'${callNumber}')
        or contains(telephone1,'${callNumber}')
        or contains(telephone2,'${callNumber}')
        or contains(telephone3,'${callNumber}')
        `,
        $top: 1
    }
    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
    return request(`${domain}/api/data/v9.2/accounts?${stringify(params)}`);
}

export const getLead = (callNumber: string) => {
    const params = {
        $filter: `contains(mobilephone,'${callNumber}')
        or contains(telephone1,'${callNumber}')
        or contains(telephone2,'${callNumber}')
        or contains(telephone3,'${callNumber}')
        or contains(address1_telephone1,'${callNumber}')
        or contains(address1_telephone2,'${callNumber}')
        or contains(address1_telephone3,'${callNumber}')
        or contains(address2_telephone1,'${callNumber}')
        or contains(address2_telephone2,'${callNumber}')
        or contains(address2_telephone3,'${callNumber}')
        `,
        $top: 1
    }
    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
    return request(`${domain}/api/data/v9.2/leads?${stringify(params)}`);
}

export const getMysystemUserId = (user: LooseObject) => {
    const params = {
        $filter: `contains(internalemailaddress,'${user.mail}')`,
        $top: 1
    }
    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
    return request(`${domain}/api/data/v9.2/systemusers?${stringify(params)}`);
}

export const putCallInfo = (params: LooseObject) => {
    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
    return request(`${domain}/api/data/v9.2/phonecalls`, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
            'Content-Type': 'application/json'
        }
    })
}