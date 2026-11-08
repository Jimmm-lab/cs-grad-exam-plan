/* Supabase 專案設定。填好以後，每台裝置打開網站就能直接登入同步，不用各自貼設定。
 *
 * url：Project Settings → API Keys（或 Data API）裡的 Project URL，例如 https://abcdefgh.supabase.co
 * key：同一頁的 publishable key（sb_publishable_…），或舊版的 anon public key
 *
 * 這兩個值本來就是公開的（任何人打開網頁原始碼都看得到），資料靠資料表的 Row Level Security
 * 保護：每個人只能讀寫自己的筆跡。千萬不要填 service_role 或 secret key。
 */
window.CGEP_SUPABASE = {
  url: "https://tvinjtrlwzxxqhivqqyl.supabase.co",
  key: "sb_publishable_dolqojM0S9kHuCzzOGJTeQ_UX63g3MW"
};
