import { useState, useEffect, FormEvent } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { businessService, Business, CreateBusinessDto } from "../services/business.service";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

export default function BusinessManagement() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: "",
    legalName: "",
    taxNumber: "",
    currency: "USD",
    taxRate: 0,
    address: "",
    phone: "",
    website: "",
    logoUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#F59E0B",
  });

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    setIsLoading(true);
    try {
      const data = await businessService.getMyBusiness();
      setBusiness(data);
      // Populate form with existing data
      setFormData({
        name: data.name || "",
        legalName: data.legalName || "",
        taxNumber: data.taxNumber || "",
        currency: data.currency || "USD",
        taxRate: data.taxRate || 0,
        address: data.address || "",
        phone: data.phone || "",
        website: data.website || "",
        logoUrl: data.logoUrl || "",
        primaryColor: data.primaryColor || "#3B82F6",
        secondaryColor: data.secondaryColor || "#1E40AF",
        accentColor: data.accentColor || "#F59E0B",
      });
    } catch (err: any) {
      // If no business exists yet, that's okay - we'll create one
      if (err.message?.includes("not found") || err.response?.status === 404) {
        setBusiness(null);
      } else {
        setError(err.message || "Failed to load business");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      if (business) {
        // Update existing business
        await businessService.updateBusiness(business.id, formData);
        setSuccess("Business profile updated successfully!");
      } else {
        // Create new business
        await businessService.createBusiness(formData);
        setSuccess("Business profile created successfully!");
      }
      await fetchBusiness();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save business");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof CreateBusinessDto, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Business Management" />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {business ? "Business Profile" : "Create Business Profile"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {business 
                ? "Manage your company information and branding" 
                : "Set up your business profile to get started"}
            </p>
          </div>
          {business && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "primary"}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Business Name *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  disabled={!isEditing && !!business}
                  required
                />
              </div>
              <div>
                <Label>Legal Name</Label>
                <Input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => handleChange("legalName", e.target.value)}
                  disabled={!isEditing && !!business}
                />
              </div>
              <div>
                <Label>Tax Number</Label>
                <Input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => handleChange("taxNumber", e.target.value)}
                  disabled={!isEditing && !!business}
                />
              </div>
              <div>
                <Label>Currency</Label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  disabled={!isEditing && !!business}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="TND">TND - Tunisian Dinar</option>
                </select>
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)}
                  disabled={!isEditing && !!business}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={!isEditing && !!business}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  disabled={!isEditing && !!business}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  disabled={!isEditing && !!business}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Branding Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Branding
            </h2>
            <div className="space-y-6">
              {/* Logo URL */}
              <div>
                <Label>Logo URL</Label>
                <Input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  disabled={!isEditing && !!business}
                  placeholder="https://example.com/logo.png"
                />
                {formData.logoUrl && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Logo Preview:</p>
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used for buttons, links, and primary actions
                  </p>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used for headers and secondary elements
                  </p>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used for highlights and special elements
                  </p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Color Preview:</p>
                <div className="flex gap-4 flex-wrap">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm"
                      style={{ backgroundColor: formData.primaryColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Primary</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm"
                      style={{ backgroundColor: formData.secondaryColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Secondary</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm"
                      style={{ backgroundColor: formData.accentColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Accent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(isEditing || !business) && (
            <div className="flex justify-end gap-4">
              {business && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    if (business) {
                      setFormData({
                        name: business.name || "",
                        legalName: business.legalName || "",
                        taxNumber: business.taxNumber || "",
                        currency: business.currency || "USD",
                        taxRate: business.taxRate || 0,
                        address: business.address || "",
                        phone: business.phone || "",
                        website: business.website || "",
                        logoUrl: business.logoUrl || "",
                        primaryColor: business.primaryColor || "#3B82F6",
                        secondaryColor: business.secondaryColor || "#1E40AF",
                        accentColor: business.accentColor || "#F59E0B",
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : business ? "Save Changes" : "Create Business Profile"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
