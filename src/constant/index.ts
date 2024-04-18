export const CLIENT_CONFIG = {
    tenant: 'organizations',
    client_id: '3372aeeb-b64a-444e-ad02-8ae467ed513b',
    response_type: 'code',
    redirect_uri: 'http://localhost:3000',
    response_mode: 'fragment',
    scope: `User.Read offline_access`,
};

export const REQUEST_CODE = {
    ok: 200,
    created: 201,
    deleted: 204,
    dataError: 400,
    noAuthority: 401,
    noFound: 404,
    serverError: 500,
    gatewayError: 502,
    serverOverload: 503,
    serverTimeout: 504,
    connectError: 'CONNECT_ERROR',
    invalidToken: 'INVALID_TOKEN',
    reConnect: 'RECONNECT',
};

/**
 * sessionStorage key
 * @type {{apiHost: string, host: string, token: string}}
 */
export const SESSION_STORAGE_KEY = {
    userToken: 'userToken',
    userTokenInfo: 'userTokenInfo',
    CRMToken: 'CRMToken',
    CRMTokenInfo: 'CRMTokenInfo',
    domain: 'domain',
    apiHost: 'apiHost',
    clientId: 'clientId',
    tenant: 'tenant'
};

/**
 * 监听wave事件key
 * @type {{recvP2PIncomingCall: string, answerP2PCall: string, rejectP2PCall: string, hangupP2PCall: string}}
 */
export const EVENT_KEY = {
    recvP2PIncomingCall: 'onRecvP2PIncomingCall', // 收到来电
    answerP2PCall: 'onAnswerP2PCall', // 接听来电
    hangupP2PCall: 'onHangupP2PCall', // 挂断来电
    rejectP2PCall: 'onRejectP2PCall', // 拒接来电
    initP2PCall: 'onInitP2PCall', // wave发去呼叫
    p2PCallCanceled: 'onP2PCallCanceled', // 未接来电、去电
    initPluginWindowOk: 'onInitPluginWindowOk', //初始化窗口成功
    onViewCustomerInfos: 'onViewCustomerInfos' // 收到客户信息
};

export const WAVE_CALL_TYPE = {
    in: 'Inbound',
    out: 'Outbound',
    miss: 'Missed',
};

export const DATE_FORMAT = {
    format_1: 'YYYY/MM/DD',
    format_2: 'YYYY/MM/DD HH/mm/ss',
    format_3: 'YYYY-MM-DD HH-mm-ss',
    format_4: 'YYYY-MM-DDTHH:mm:ss',
    format_5: 'HH:mm:ss'
};

export const MODULES = {
    contact: 'Contacts',
    account: 'Accounts',
    lead: 'Leads',
};

export type CONFIG_SHOW = {
    None: null | undefined
    Name: string[],
    Phone: string,
    Fax: string,
    Email: string,
    Company: string,
    Title: string,
    Department: string,
    Description: string,
}

export const CONFIG_SHOW: CONFIG_SHOW = {
    None: undefined,
    Name: ['fullname', 'name'],
    Phone: "Phone",
    Fax: 'fax',
    Email: 'emailaddress1',
    Company: 'companyname',
    Title: 'jobtitle',
    Department: 'department',
    Description: 'description',
}


export const NOTIFICATION_CONFIG_DEF = {
    first: 'Name',
    second: 'Phone',
    third: 'None',
    forth: 'None',
    fifth: 'None',
}


export const AUTO_CREATE_CONFIG_DEF = {
    numberType: 'Wave',
    direction: 'All',
    entityType: 'Contact',
    firstName: 'Wave [Number]',
    lastName: 'New',
}

export const UPLOAD_CALL_CONFIG_DEF = {
    subject: 'Wave PhoneSystem Call',
    Inbound: '[DateTime]: Incoming call from [Number] [Name] to [Agent]([Duration])',
    Missed: '[DateTime]: Missed call from [Number] [Name] to [Agent]',
    Outbound: '[DateTime]: Outgoing call from [Agent] to [Number] [Name] ([Duration])',
    unansweredOutbound: '[DateTime]: Unanswered outgoing call from [Agent] to [Number] [Name]'
}

export const CREATION_CONFIG_CONTACT_TYPE = [
    'Contact', 'Lead', 'Account'
]

export const CREATION_CONFIG_CONTACT_TYPE_DEF: any = {
    Contact: 'contact',
    Lead: 'lead',
    Account: 'account'
}

export const NotificationConfig = {
    first: 'Information 1',
    second: 'Information 2',
    third: 'Information 3',
    forth: 'Information 4',
    fifth: 'Information 5'
}

export const MICROSOFT_GRAPH_SERVER_ADDRESS = 'https://graph.microsoft.com';

export const MICROSOFT_LOGIN_SERVER_ADDRESS = 'https://login.microsoftonline.com';