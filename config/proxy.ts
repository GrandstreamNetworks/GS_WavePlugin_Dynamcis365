export default {
    dev: {
        '/api': {
            target: `https://org8e033d3e.crm4.dynamics.com/`,
            // target: `https://admin.services.crm.dynamics.com/`,
            changeOrigin: true,
            pathRewrite: {
                '': '',
            },
        },

        '/organizations': {
            target: 'https://login.microsoftonline.com',
            changeOrigin: true,
            pathRewrite: {
                '': '/',
            },
        }
    },
};
