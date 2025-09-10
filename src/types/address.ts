export interface Address {
  id: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  city: string
  country: string
}

export interface ParsedAddresses {
  addresses: Address[]
  errors: string[]
}

export type PrintFormat = 
  | 'A4' 
  | 'A4_LABELS_10' 
  | 'ROLL_57x32'
  | 'A4_LABELS_21'
  | 'A4_COMPACT'
  | 'CSV_EXPORT'

export interface PrintOptions {
  format: PrintFormat
  margin: number
  fontSize: number
}
