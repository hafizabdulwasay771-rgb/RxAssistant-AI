import { useEffect, useState } from "react";
import { getMedicines } from "../../services/inventoryService";

function Sales() {
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMedicines();
        setMedicines(data);
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, []);

  function addToCart(medicine) {
    const existing = cart.find(
      (item) => item.id === medicine.id
    );

    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === medicine.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...medicine,
          quantity: 1,
        },
      ]);
    }
  }
function increaseQuantity(id) {

  const cartItem = cart.find(
    (item) => item.id === id
  );

  const stockItem = medicines.find(
    (medicine) => medicine.id === id
  );

  if (cartItem.quantity >= stockItem.quantity) {
    alert(`Only ${stockItem.quantity} units available in stock.`);
    return;
  }

  setCart(
    cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    )
  );

}

function decreaseQuantity(id) {
  setCart(
    cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0)
  );
}

function removeFromCart(id) {
  setCart(
    cart.filter((item) => item.id !== id)
  );
}
  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        Sales (POS)
      </h1>

      <div className="grid grid-cols-3 gap-6">

        {/* Left Side */}

        <div className="col-span-2">

          <div className="rounded-2xl border bg-white p-6 shadow">

            <input
              type="text"
              placeholder="Search medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border p-4"
            />

            <div className="mt-6 space-y-2">

              {medicines
                .filter((medicine) =>
                  medicine.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .slice(0, 8)
                .map((medicine) => (

                  <div
                    key={medicine.id}
                    onClick={() => addToCart(medicine)}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-slate-50 cursor-pointer"
                  >

                    <div>

                      <h3 className="font-semibold">
                        {medicine.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {medicine.dosage_form} • {medicine.therapeutic_class}
                      </p>

                    </div>

                    <div className="font-semibold text-teal-600">
                      Rs. {medicine.selling_price}
                    </div>

                  </div>

                ))}

            </div>

          </div>

        </div>

        {/* Right Side */}

        <div>

          <div className="rounded-2xl border bg-white p-6 shadow">

            <h2 className="text-xl font-bold">
              Cart
            </h2>

            <div className="mt-6 space-y-3">

              {cart.length === 0 ? (

                <p className="text-slate-500">
                  No medicines added.
                </p>

              ) : (

                cart.map((item) => (

                 <div
  key={item.id}
  className="flex items-center justify-between border-b pb-3"
>

  <div>

    <p className="font-semibold">
      {item.name}
    </p>

    <p className="text-sm text-slate-500">
      Rs. {item.selling_price}
    </p>

  </div>

  <div className="flex items-center gap-2">

    <button
      onClick={() => decreaseQuantity(item.id)}
      className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300"
    >
      -
    </button>

    <span className="w-6 text-center font-semibold">
      {item.quantity}
    </span>

    <button
      onClick={() => increaseQuantity(item.id)}
      className="h-8 w-8 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
    >
      +
    </button>

  </div>

  <div className="flex items-center gap-3">

    <span className="font-semibold">
      Rs. {item.selling_price * item.quantity}
    </span>

    <button
      onClick={() => removeFromCart(item.id)}
      className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
    >
      🗑
    </button>

  </div>

</div>

                ))

              )}

            </div>

            <hr className="my-6" />

            <div className="flex justify-between">

              <span>Total</span>

              <span className="font-bold">
                Rs.{" "}
                {cart.reduce(
                  (sum, item) =>
                    sum + item.selling_price * item.quantity,
                  0
                )}
              </span>

            </div>

            <button className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-white font-semibold">
              Complete Sale
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Sales;


