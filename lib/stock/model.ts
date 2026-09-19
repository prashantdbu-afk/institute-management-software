import {z} from "zod"
export const stockFormSchema=z.object({itemName:z.string().trim().min(1).max(200),category:z.string().trim().max(100),quantity:z.coerce.number().int().min(0),minimumStock:z.coerce.number().int().min(0),unitPrice:z.coerce.number().min(0),supplier:z.string().trim().max(200),branchId:z.string().uuid()})
export type StockFormData=z.infer<typeof stockFormSchema>
export const stockRowSchema=z.object({id:z.string().uuid(),item_name:z.string(),category:z.string().nullable(),quantity:z.number().int(),minimum_stock:z.number().int().nullable(),unit_price:z.coerce.number().nullable(),supplier:z.string().nullable(),branch_id:z.string().uuid(),created_at:z.string().nullable(),updated_at:z.string().nullable()})
export type StockRow=z.infer<typeof stockRowSchema>
export type StockView=StockFormData&{id:string;branchName:string;updatedAt:string|null}
export function mapStock(r:StockRow,branches:{id:string;name:string}[]):StockView{return{id:r.id,itemName:r.item_name,category:r.category??"",quantity:r.quantity,minimumStock:r.minimum_stock??0,unitPrice:r.unit_price??0,supplier:r.supplier??"",branchId:r.branch_id,branchName:branches.find(x=>x.id===r.branch_id)?.name??"Branch",updatedAt:r.updated_at}}
