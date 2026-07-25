import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'failed'

export interface IInvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId
  team_id: mongoose.Types.ObjectId
  invoice_id: string
  status: InvoiceStatus
  amount: number
  currency: string
  issued_at: Date
  due_at: Date
  paid_at?: Date
  period_start: Date
  period_end: Date
  billing_email?: string
  invoice_email?: string
  po_number?: string
  line_items: IInvoiceLineItem[]
  is_test: boolean
  metadata?: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const InvoiceSchema = new Schema<IInvoice>({
  team_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  invoice_id: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'failed'],
    default: 'pending'
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  issued_at: { type: Date, required: true, default: Date.now },
  due_at: { type: Date, required: true },
  paid_at: { type: Date },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  billing_email: { type: String },
  invoice_email: { type: String },
  po_number: { type: String },
  line_items: { type: [InvoiceLineItemSchema], default: [] },
  is_test: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

InvoiceSchema.index({ team_id: 1, issued_at: -1 })
InvoiceSchema.index({ team_id: 1, status: 1 })
InvoiceSchema.index({ invoice_id: 1 }, { unique: true })

InvoiceSchema.pre('save', function() {
  this.updated_at = new Date()
})

type IInvoiceModel = Model<IInvoice>

export const Invoice = (models.Invoice ||
  model<IInvoice, IInvoiceModel>('Invoice', InvoiceSchema)) as IInvoiceModel

export default Invoice
