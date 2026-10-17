import { mountApp } from './app/router.js';

const root = document.getElementById('app');
if (root) mountApp(root);
