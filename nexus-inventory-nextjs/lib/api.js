const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
export function token(){if(typeof window==="undefined")return "";return localStorage.getItem("token")||""}
export async function api(path, options={}){
  const headers={...(options.body instanceof FormData?{}:{"Content-Type":"application/json"}),...(options.headers||{}),...(token()?{Authorization:`Bearer ${token()}`}:{})};
  const res=await fetch(`${BASE}${path}`,{...options,headers,cache:"no-store"});
  const type=res.headers.get("content-type")||"";
  if(!res.ok){let msg=`Request failed (${res.status})`;try{const d=type.includes("json")?await res.json():null;msg=d?.error||d?.message||msg}catch{}throw new Error(msg)}
  if(type.includes("application/json"))return res.json();
  return res;
}
export const endpoints={
  products:"/products",categories:"/categories",suppliers:"/partners/suppliers",customers:"/partners/customers",transactions:"/transactions",users:"/users",logs:"/admin/logs"
};
