import AdminProducts from "../components/AdminProducts";
import { useNavigate } from "react-router-dom";
const ProductsPage = () => {
  const navigate = useNavigate();
  return <AdminProducts onEdit={id => navigate(`/admin/products/edit/${id}`)} />;
};
export default ProductsPage;
