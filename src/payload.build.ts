import path from 'path'
import { fileURLToPath } from 'url'
import { en as adminLanguage } from '@payloadcms/translations/languages/en'
import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Branches } from './collections/Branches'
import { Products } from './collections/Products'
import { PriceHistory } from './collections/PriceHistory'
import { Clients } from './collections/Clients'
import { Suppliers } from './collections/Suppliers'
import { BankAccounts } from './collections/BankAccounts'
import { Inventory, InventoryMovements } from './collections/Inventory'
import { Sales } from './collections/Sales'
import { CashConcepts, CashMovements, CashClosings } from './collections/Cash'
import { Domicilios, Events, AuditLogs, Notifications, Couriers } from './collections/Operations'
import { ProductCategories, ProductTypes } from './collections/Catalog'
import { CashCategories, CashDeliveries, ElectronicInvoices } from './collections/Finance'
import { Promotions, SiteEvents } from './collections/Marketing'
import { RolePermissions, UserPermissions, RecoveryTokens } from './collections/Access'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Config compartida entre Figma Make y despliegue Vercel/Netlify. */
export const sharedPayloadConfig = {
  admin: {
    user: Admins.slug,
    constrainWidth: true,
    dashboard: {
      widgets: [] as { widgetSlug: string; width: string }[],
      defaultLayout: [
        { widgetSlug: 'activity', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: 'en' as const,
    supportedLanguages: { en: adminLanguage },
  },
  collections: [
    Admins, Users, Media, Folders, Tags, Branches, Products, PriceHistory, Clients, Suppliers, BankAccounts,
    Inventory, InventoryMovements, Sales, Domicilios, Couriers, ProductCategories, ProductTypes, CashCategories, CashDeliveries, ElectronicInvoices, Promotions, SiteEvents, RolePermissions, UserPermissions, RecoveryTokens, CashConcepts, CashMovements, CashClosings,
    Events, AuditLogs, Notifications,
  ],
  globals: [SiteSettings],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [{ code: 'en', label: 'English' }],
    fallback: true,
    defaultLocale: 'en' as const,
  },
}

export const isFigmaMake = () => process.env.FIGMA === '1'
