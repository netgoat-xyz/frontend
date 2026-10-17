import mongoose, { Schema, type Model, type Types } from "mongoose";

export const DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "CAA",
] as const;

export type DNSRecordType = (typeof DNS_RECORD_TYPES)[number];

const DNSRecordSchema = new Schema(
  {
    team_id: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    domain_id: { type: Schema.Types.ObjectId, ref: "Domain", required: true, index: true },
    domain: { type: String, required: true, index: true, lowercase: true },

    type: { type: String, enum: DNS_RECORD_TYPES, required: true },
    /** "@" for the apex, otherwise the subdomain label. */
    name: { type: String, required: true },
    value: { type: String, required: true },
    ttl: { type: Number, default: 3600 },
    priority: Number,

    proxied: { type: Boolean, default: false },

    active: { type: Boolean, default: true },
    propagated: { type: Boolean, default: false },
    last_checked: Date,

    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    collection: "dnsrecords",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: "__v",
  },
);

DNSRecordSchema.index({ domain: 1, type: 1, name: 1 });
DNSRecordSchema.index({ team_id: 1, domain: 1 });

export type DNSRecordDocument = {
  _id: Types.ObjectId;
  team_id: Types.ObjectId;
  domain_id: Types.ObjectId;
  domain: string;
  type: DNSRecordType;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  active: boolean;
  propagated: boolean;
  last_checked?: Date;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
};

export const DNSRecord: Model<DNSRecordDocument> =
  (mongoose.models.DNSRecord as Model<DNSRecordDocument>) ??
  mongoose.model<DNSRecordDocument>("DNSRecord", DNSRecordSchema, "dnsrecords");

export default DNSRecord;
