import AdminEditProduct from "../components/AdminEditProduct";
import { useNavigate, useParams } from "react-router-dom";
const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return <AdminEditProduct id={id} onDone={() => navigate("/admin/products")} />;
};
export default EditProductPage;
