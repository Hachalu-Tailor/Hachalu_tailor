// Hooks Index - Export all hooks from a single entry point

export {
    default as useAuth,
    useIsAuthenticated,
    useUserRole,
    useHasRole,
    useIsAdmin,
    useIsReceptionist
} from './useAuth';

export {
    useApi,
    usePagination,
    useDebounce,
    useLocalStorage,
    useForm
} from './useApi';

export { default as useCart } from './useCart';
export { default as useProductData } from './productData';
