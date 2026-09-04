import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export interface AdminProductInput {
  id?: string
  name: string
  price: number
  category: string
  tag?: string
  description?: string
  imageUrl?: string
  imageStorageId?: string
  active: boolean
}

let client: ConvexHttpClient | null = null

function getClient(): ConvexHttpClient {
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined
  if (!url) throw new Error("Backend is not configured")
  client ??= new ConvexHttpClient(url)
  return client
}

export const adminLogin = (password: string): Promise<boolean> =>
  getClient().mutation(api.admin.login, { password })

export const listAllProducts = (password: string) =>
  getClient().query(api.admin.listAll, { password })

export const listOrders = (password: string) =>
  getClient().query(api.admin.listOrders, { password })

export const updateOrderStatus = (
  password: string,
  id: string,
  status: string,
) =>
  getClient().mutation(api.admin.updateOrderStatus, {
    password,
    id: id as Id<"orders">,
    status,
  })

export const saveProduct = (password: string, input: AdminProductInput) =>
  getClient().mutation(api.admin.upsertProduct, {
    password,
    ...input,
    id: input.id as Id<"products"> | undefined,
    imageStorageId: input.imageStorageId as Id<"_storage"> | undefined,
  })

export const deleteProduct = (password: string, id: string) =>
  getClient().mutation(api.admin.deleteProduct, {
    password,
    id: id as Id<"products">,
  })

/** Uploads a photo to Convex storage and returns the storage id. */
export async function uploadProductPhoto(
  password: string,
  file: File,
): Promise<string> {
  const uploadUrl = await getClient().mutation(api.admin.generateUploadUrl, {
    password,
  })
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  })
  const storageId = response.headers.get("x-convex-storage-id")
  if (!storageId) throw new Error("Photo upload failed")
  return storageId
}

export const ADMIN_SESSION_KEY = "asthetic-admin-password"