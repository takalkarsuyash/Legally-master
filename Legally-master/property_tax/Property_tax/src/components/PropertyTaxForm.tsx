import { useState, useEffect } from "react";
import { calculatePropertyTax } from "../tax-engine/calculateTax";

type City =
  | "Delhi"
  | "Bangalore"
  | "Hyderabad"
  | "Ahmedabad"
  | "Chennai"
  | "Kolkata"
  | "Mumbai"
  | "Pune";

export default function PropertyTaxForm() {
  const [city, setCity] = useState<City>("Delhi");
  const [result, setResult] = useState<ReturnType<
    typeof calculatePropertyTax
  > | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});

  // 🔥 Reset form when city changes
  useEffect(() => {
    setFormData({});
    setResult(null);
  }, [city]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (!formData.propertyAge) {
      alert("Please fill required fields");
      return;
    }

    const payload: Record<string, unknown> = { city };

    if (["Delhi", "Bangalore", "Hyderabad", "Ahmedabad"].includes(city)) {
      payload.area = Number(formData.area);
      payload.propertyType = formData.propertyType ?? "Residential";
      payload.usage = formData.usage ?? "SelfOccupied";
      payload.propertyAge = Number(formData.propertyAge);
      payload.zone = formData.zone ?? "A";
    }

    if (["Chennai", "Kolkata"].includes(city)) {
      payload.monthlyRent = Number(formData.monthlyRent);
      payload.propertyAge = Number(formData.propertyAge);
      payload.zone = formData.zone ?? "A";
    }

    if (["Mumbai", "Pune"].includes(city)) {
      payload.marketValue = Number(formData.marketValue);
      payload.constructionType = formData.constructionType ?? "RCC";
      payload.propertyAge = Number(formData.propertyAge);
      payload.usage = formData.usage ?? "SelfOccupied";
    }

    console.log("Payload:", payload);

    const taxResult = calculatePropertyTax(payload as any);
    setResult(taxResult);
  };

  return (
    <div>
      <h2>Property Tax Calculator</h2>

      {/* City Selection */}
      <select value={city} onChange={(e) => setCity(e.target.value as City)}>
        <option>Delhi</option>
        <option>Bangalore</option>
        <option>Hyderabad</option>
        <option>Ahmedabad</option>
        <option>Chennai</option>
        <option>Kolkata</option>
        <option>Mumbai</option>
        <option>Pune</option>
      </select>

      {/* UAV Fields */}
      {["Delhi", "Bangalore", "Hyderabad", "Ahmedabad"].includes(city) && (
        <>
          <input
            name="area"
            placeholder="Area (sq ft)"
            onChange={handleChange}
          />
          <select
            name="propertyType"
            value={formData.propertyType || "Residential"}
            onChange={handleChange}
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
          <select
            name="usage"
            value={formData.usage || "SelfOccupied"}
            onChange={handleChange}
          >
            <option value="SelfOccupied">Self Occupied</option>
            <option value="Rented">Rented</option>
          </select>
          <input
            name="propertyAge"
            placeholder="Property Age"
            onChange={handleChange}
          />
          <select
            name="zone"
            value={formData.zone || "A"}
            onChange={handleChange}
          >
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
          </select>
        </>
      )}

      {/* ARV Fields */}
      {["Chennai", "Kolkata"].includes(city) && (
        <>
          <input
            name="monthlyRent"
            placeholder="Monthly Rent"
            onChange={handleChange}
          />
          <input
            name="propertyAge"
            placeholder="Property Age"
            onChange={handleChange}
          />
          <select
            name="zone"
            value={formData.zone || "A"}
            onChange={handleChange}
          >
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
          </select>
        </>
      )}

      {/* CVS Fields */}
      {["Mumbai", "Pune"].includes(city) && (
        <>
          <input
            name="marketValue"
            placeholder="Market Value"
            onChange={handleChange}
          />
          <select
            name="constructionType"
            value={formData.constructionType || "RCC"}
            onChange={handleChange}
          >
            <option value="RCC">RCC</option>
            <option value="NonRCC">Non RCC</option>
          </select>
          <input
            name="propertyAge"
            placeholder="Property Age"
            onChange={handleChange}
          />
          <select
            name="usage"
            value={formData.usage || "SelfOccupied"}
            onChange={handleChange}
          >
            <option value="SelfOccupied">Self Occupied</option>
            <option value="Rented">Rented</option>
          </select>
        </>
      )}

      <button onClick={handleSubmit}>Calculate</button>

      {result && (
        <div>
          <h3>Tax Amount: ₹ {Number(result.taxAmount).toFixed(2)}</h3>
        </div>
      )}
    </div>
  );
}
