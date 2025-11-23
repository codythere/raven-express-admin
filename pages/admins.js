import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import { prettyDate } from "@/lib/date";
import axios from "axios";
import { useEffect, useState } from "react";
import { withSwal } from "react-sweetalert2";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

function AdminsPage({ swal }) {
  const [email, setEmail] = useState("");
  const [adminEmails, setAdminEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  function addAdmin(event) {
    event.preventDefault();

    // ✅ 前端先檢查一次，防呆
    if (!isAdmin) {
      toast.error("你目前沒有管理員權限，無法新增管理員");
      return;
    }

    axios
      .post("/api/admins", { email })
      .then((response) => {
        console.log(response.data);
        swal.fire({
          title: "成功新增管理員!",
          icon: "success",
        });
        setEmail("");
        loadAdmins();
      })
      .catch((err) => {
        swal.fire({
          title: "錯誤訊息",
          text: err.response.data.message,
          icon: "error",
        });
      });
  }
  function loadAdmins() {
    setIsLoading(true);
    axios.get("/api/admins").then((response) => {
      setAdminEmails(response.data);
      setIsLoading(false);
    });
  }
  function deleteAdmin(_id, email) {
    // ✅ 前端先檢查一次，直接跳 toast，不打 API
    if (!isAdmin) {
      toast.error("你目前沒有管理員權限，無法刪除管理員");
      return;
    }

    swal
      .fire({
        title: "Are you sure",
        text: `確定要刪除管理員 ${email}?`,
        showCancelButton: true,
        cancelButtonText: "取消",
        confirmButtonText: "刪除",
        confirmButtonColor: "#d55",
        reverseButtons: true,
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          axios.delete("/api/admins?_id=" + _id).then(() => {
            swal.fire({
              title: "成功移除管理員!",
              icon: "success",
            });
            loadAdmins();
          });
        }
      });
  }

  useEffect(() => {
    loadAdmins();
  }, []);
  return (
    <Layout>
      <h1>管理員</h1>
      <h2>新增管理員</h2>
      <form onSubmit={addAdmin}>
        <div className="flex gap-2">
          <input
            type="text"
            className="mb-0"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="請輸入 Google 電子信箱"
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-1.5 rounded-sm shadow-sm whitespace-nowrap flex justify-center  "
          >
            新增管理員
          </button>
        </div>
      </form>
      <h2>現有的管理員</h2>
      <table className="basic">
        <thead>
          <tr>
            <th className="text-left">管理員 Google 電子信箱</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={2}>
                <div className="py-4">
                  <Spinner fullWidth={true} />
                </div>
              </td>
            </tr>
          )}
          {adminEmails.length > 0 &&
            adminEmails.map((adminEmail) => (
              <tr key={adminEmail._id}>
                <td>{adminEmail.email}</td>
                <td>
                  {adminEmail.createdAt && prettyDate(adminEmail.createdAt)}
                </td>
                <td>
                  <button
                    onClick={() => {
                      deleteAdmin(adminEmail._id, adminEmail.email);
                    }}
                    className="btn-red"
                  >
                    移除
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </Layout>
  );
}

export default withSwal(({ swal }) => <AdminsPage swal={swal} />);
