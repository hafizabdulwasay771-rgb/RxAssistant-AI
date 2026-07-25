import { Outlet } from "react-router-dom";

import Navbar from "@/layouts/components/Navbar";
import Footer from "@/layouts/components/Footer";

function PublicLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default PublicLayout;