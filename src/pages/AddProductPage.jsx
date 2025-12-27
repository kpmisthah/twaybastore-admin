import AdminAddProduct from "../components/AdminAddProduct";
import { useNavigate } from "react-router-dom";
const AddProductPage = () => {
  const navigate = useNavigate();
  return <AdminAddProduct onDone={() => navigate("/admin/products")} />;
};
export default AddProductPage;
