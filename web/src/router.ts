import { createRouter, createWebHistory } from 'vue-router';
import { sesion } from './auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { publica: true } },
    { path: '/', name: 'granjas', component: () => import('./views/GranjasView.vue') },
    { path: '/granjas/:id', name: 'granja', component: () => import('./views/GranjaView.vue'), props: true },
    { path: '/requisitos', name: 'requisitos', component: () => import('./views/RequisitosView.vue') },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('./views/UsuariosView.vue'),
      meta: { soloAdmin: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  if (!to.meta.publica && !sesion.token) return { name: 'login', query: to.fullPath !== '/' ? { ir: to.fullPath } : {} };
  if (to.name === 'login' && sesion.token) return { name: 'granjas' };
  if (to.meta.soloAdmin && sesion.usuario?.rol !== 'admin') return { name: 'granjas' };
  return true;
});

export default router;
