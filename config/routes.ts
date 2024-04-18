export default [
    {
        path: '/',
        redirect: '/login',
        exact: true
    },
    {
        path: '/login',
        name: 'login',
        exact: true,
        component: './Login'
    },
    {
        path: '/',
        component: '@/layouts',
        routes: [
            {
                path: '/home',
                name: 'home',
                component: './Home',
            },
            {
                name: 'syncConfig',
                path: '/syncConfig',
                component: '@/components/SyncConfig',
            },
            {
                name: 'notificationConfig',
                path: '/notificationConfig',
                component: '@/components/NotificationConfig'
            },
            {
                name: 'creationConfig',
                path: '/creationConfig',
                component: '@/components/CreationConfig'
            }
        ]
    },
];
