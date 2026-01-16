import { createI18n } from 'vue-i18n';

export type SupportedLocale = 'pt' | 'en' | 'es';

const messages = {
  pt: {
    common: {
      appName: 'Controle de Estoque',
      login: 'Entrar',
      dashboard: 'Dashboard',
      products: 'Produtos',
      sales: 'Vendas',
      users: 'Usuarios',
      language: 'Idioma',
      yes: 'Sim',
      no: 'Nao'
    },
    roles: {
      operator: 'Operador',
      manager: 'Gerente',
      admin: 'Administrador'
    },
    public: {
      headline: 'Operacao simples, segura e escalavel para o seu time.',
      hero: 'Gestao clara de produtos, vendas e usuarios em um fluxo unico.'
    },
    auth: {
      title: 'Resumo geral',
      subtitle: 'Os modulos estarao disponiveis apos a configuracao de autenticacao.',
      cards: {
        products: 'Cadastros, categorias e estoque minimo.',
        sales: 'Fluxo de vendas e historico consolidado.',
        users: 'Permissoes e acessos por papel.'
      }
    },
    login: {
      tag: 'Acesso seguro',
      subtitle: 'Use seu email corporativo para continuar.',
      email: 'Email',
      password: 'Senha',
      remember: 'Lembrar de mim',
      button: 'Acessar',
      loading: 'Entrando...',
      error: 'Credenciais invalidas.',
      hint: 'Ambiente de demonstracao. Autenticacao sera habilitada na proxima etapa.'
    },
    products: {
      title: 'Produtos',
      subtitle: 'Gerencie itens vendaveis e estoque atual.',
      new: 'Novo produto',
      closeForm: 'Fechar formulario',
      create: 'Criar produto',
      update: 'Atualizar produto',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Excluir',
      actions: 'Acoes',
      loading: 'Carregando produtos...',
      error: 'Nao foi possivel carregar os produtos.',
      confirmDelete: 'Confirma a exclusao deste produto?',
      fields: {
        name: 'Nome',
        barcode: 'Codigo de barras',
        sku: 'SKU',
        price: 'Preco',
        stock: 'Estoque',
        active: 'Ativo'
      }
    },
    dashboard: {
      eyebrow: 'Painel geral',
      title: 'Visao consolidada',
      subtitle: 'Acompanhe indicadores e alertas principais.',
      lowStock: 'Estoque baixo',
      lowStockHint: 'Itens abaixo do minimo',
      salesToday: 'Vendas do dia',
      salesTodayHint: 'Atualizado em tempo real',
      pending: 'Pendentes',
      pendingHint: 'Aguardando confirmacao',
      recentSales: 'Vendas recentes',
      lastUpdated: 'Atualizado agora',
      alerts: 'Alertas'
    }
  },
  en: {
    common: {
      appName: 'Inventory Control',
      login: 'Sign in',
      dashboard: 'Dashboard',
      products: 'Products',
      sales: 'Sales',
      users: 'Users',
      language: 'Language',
      yes: 'Yes',
      no: 'No'
    },
    roles: {
      operator: 'Operator',
      manager: 'Manager',
      admin: 'Admin'
    },
    public: {
      headline: 'Simple, secure, scalable operations for your team.',
      hero: 'Clear product, sales, and user management in one flow.'
    },
    auth: {
      title: 'Overall summary',
      subtitle: 'Modules will be available after authentication setup.',
      cards: {
        products: 'Catalogs, categories, and minimum stock.',
        sales: 'Sales flow and consolidated history.',
        users: 'Role-based permissions and access.'
      }
    },
    login: {
      tag: 'Secure access',
      subtitle: 'Use your corporate email to continue.',
      email: 'Email',
      password: 'Password',
      remember: 'Remember me',
      button: 'Continue',
      loading: 'Signing in...',
      error: 'Invalid credentials.',
      hint: 'Demo environment. Authentication will be enabled in the next step.'
    },
    products: {
      title: 'Products',
      subtitle: 'Manage sellable items and current stock.',
      new: 'New product',
      closeForm: 'Close form',
      create: 'Create product',
      update: 'Update product',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      actions: 'Actions',
      loading: 'Loading products...',
      error: 'Could not load products.',
      confirmDelete: 'Confirm deleting this product?',
      fields: {
        name: 'Name',
        barcode: 'Barcode',
        sku: 'SKU',
        price: 'Price',
        stock: 'Stock',
        active: 'Active'
      }
    },
    dashboard: {
      eyebrow: 'Control center',
      title: 'Consolidated view',
      subtitle: 'Track key indicators and alerts.',
      lowStock: 'Low stock',
      lowStockHint: 'Items below minimum',
      salesToday: 'Sales today',
      salesTodayHint: 'Updated in real time',
      pending: 'Pending',
      pendingHint: 'Awaiting confirmation',
      recentSales: 'Recent sales',
      lastUpdated: 'Updated now',
      alerts: 'Alerts'
    }
  },
  es: {
    common: {
      appName: 'Control de Inventario',
      login: 'Iniciar sesion',
      dashboard: 'Panel',
      products: 'Productos',
      sales: 'Ventas',
      users: 'Usuarios',
      language: 'Idioma',
      yes: 'Si',
      no: 'No'
    },
    roles: {
      operator: 'Operador',
      manager: 'Gerente',
      admin: 'Administrador'
    },
    public: {
      headline: 'Operacion simple, segura y escalable para tu equipo.',
      hero: 'Gestion clara de productos, ventas y usuarios en un solo flujo.'
    },
    auth: {
      title: 'Resumen general',
      subtitle: 'Los modulos estaran disponibles despues de configurar la autenticacion.',
      cards: {
        products: 'Catalogos, categorias y stock minimo.',
        sales: 'Flujo de ventas e historial consolidado.',
        users: 'Permisos y accesos por rol.'
      }
    },
    login: {
      tag: 'Acceso seguro',
      subtitle: 'Usa tu correo corporativo para continuar.',
      email: 'Correo',
      password: 'Contrasena',
      remember: 'Recordarme',
      button: 'Acceder',
      loading: 'Ingresando...',
      error: 'Credenciales invalidas.',
      hint: 'Entorno de demostracion. La autenticacion se habilitara en el siguiente paso.'
    },
    products: {
      title: 'Productos',
      subtitle: 'Gestiona articulos vendibles y stock actual.',
      new: 'Nuevo producto',
      closeForm: 'Cerrar formulario',
      create: 'Crear producto',
      update: 'Actualizar producto',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      actions: 'Acciones',
      loading: 'Cargando productos...',
      error: 'No se pudieron cargar los productos.',
      confirmDelete: 'Confirmas eliminar este producto?',
      fields: {
        name: 'Nombre',
        barcode: 'Codigo de barras',
        sku: 'SKU',
        price: 'Precio',
        stock: 'Stock',
        active: 'Activo'
      }
    },
    dashboard: {
      eyebrow: 'Panel general',
      title: 'Vista consolidada',
      subtitle: 'Sigue indicadores y alertas clave.',
      lowStock: 'Stock bajo',
      lowStockHint: 'Items por debajo del minimo',
      salesToday: 'Ventas del dia',
      salesTodayHint: 'Actualizado en tiempo real',
      pending: 'Pendientes',
      pendingHint: 'En espera de confirmacion',
      recentSales: 'Ventas recientes',
      lastUpdated: 'Actualizado ahora',
      alerts: 'Alertas'
    }
  }
};

function normalizeLocale(value?: string | null): SupportedLocale {
  if (!value) return 'pt';
  if (value.startsWith('en')) return 'en';
  if (value.startsWith('es')) return 'es';
  return 'pt';
}

const stored = localStorage.getItem('locale');
const locale = normalizeLocale(stored || 'pt');

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'pt',
  globalInjection: true,
  messages
});
