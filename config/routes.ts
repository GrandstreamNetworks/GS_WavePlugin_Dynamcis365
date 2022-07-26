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
        path: '/home',
        name: 'home',
        exact: true,
        component: './Home'
    },
];
