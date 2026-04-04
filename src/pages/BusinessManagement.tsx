import { useState, useEffect, FormEvent } from "react";
import { useBusiness } from "../contexts/BusinessContext";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { businessService, Business, CreateBusinessDto } from "../services/business.service";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";

export default function BusinessManagement() {
  const { refreshBusiness, updateBusinessColors } = useBusiness();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
    secondaryColor: "#FFFFFF",
    navbarColor: "#FFFFFF",
    sidebarColor: "#FFFFFF",
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
      if (data) {
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
          secondaryColor: data.secondaryColor || "#FFFFFF",
          navbarColor: data.navbarColor || "#FFFFFF",
          sidebarColor: data.sidebarColor || "#FFFFFF",
          accentColor: data.accentColor || "#F59E0B",
        });
        // Set logo preview if logoUrl exists
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
      }
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

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
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
      await refreshBusiness(); // Refresh context to update sidebar/favicon/colors
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save business");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof CreateBusinessDto, value: string | number) => {
    const nextFormData = { ...formData, [field]: value };
    setFormData(nextFormData);

    // Instant branding preview while editing
    if (field === 'primaryColor' || field === 'secondaryColor' || field === 'navbarColor' || field === 'sidebarColor' || field === 'accentColor') {
      updateBusinessColors({
        primaryColor: nextFormData.primaryColor,
        secondaryColor: nextFormData.secondaryColor,
        navbarColor: nextFormData.navbarColor,
        sidebarColor: nextFormData.sidebarColor,
        accentColor: nextFormData.accentColor,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      // Validate file type
      if (!file.type.match(/image\/(jpg|jpeg|png|gif|webp)/)) {
        setError("Only image files (JPG, PNG, GIF, WEBP) are allowed");
        return;
      }
      setSelectedFile(file);
      setError("");
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }
    setIsUploading(true);
    setError("");
    try {
      const result = await businessService.uploadLogo(selectedFile);
      setFormData((prev) => ({ ...prev, logoUrl: result.logoUrl }));
      setLogoPreview(result.logoUrl);
      setSuccess("Logo uploaded successfully!");
      setSelectedFile(null);
      // Refresh business data in context (updates sidebar, favicon, colors)
      await refreshBusiness();
    } catch (err: any) {
      setError(err.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const clearLogoPreview = () => {
    setLogoPreview(null);
    setSelectedFile(null);
    if (formData.logoUrl) {
      setFormData((prev) => ({ ...prev, logoUrl: "" }));
    }
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
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-panel-bg, #ffffff)',
              color: 'var(--color-panel-text, #111827)',
            }}
          >
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
                  step={0.01}
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
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-panel-bg, #ffffff)',
              color: 'var(--color-panel-text, #111827)',
            }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Branding
            </h2>
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label>Business Logo</Label>
                <div className="mt-2">
                  {(logoPreview || formData.logoUrl) && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-4">
                      <img
                        src={logoPreview || formData.logoUrl}
                        alt="Logo preview"
                        className="h-16 w-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Current Logo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedFile ? selectedFile.name : "Uploaded logo"}
                        </p>
                      </div>
                      {(isEditing || !business) && (
                        <button
                          type="button"
                          onClick={clearLogoPreview}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                  
                  {(isEditing || !business) && (
                    <div className="flex items-center gap-3">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          id="logo-upload"
                        />
                        <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedFile ? selectedFile.name : "Choose logo file"}
                          </span>
                        </div>
                      </label>
                      {selectedFile && (
                        <Button
                          onClick={handleLogoUpload}
                          disabled={isUploading}
                          variant="primary"
                        >
                          {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Supported formats: JPG, PNG, GIF, WEBP. Max size: 5MB
                  </p>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Used for panel backgrounds and base app background
                  </p>
                </div>
                <div>
                  <Label>Navbar Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.navbarColor}
                      onChange={(e) => handleChange("navbarColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.navbarColor}
                      onChange={(e) => handleChange("navbarColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used for the top navigation bar background
                  </p>
                </div>
                <div>
                  <Label>Sidebar Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.sidebarColor}
                      onChange={(e) => handleChange("sidebarColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.sidebarColor}
                      onChange={(e) => handleChange("sidebarColor", e.target.value)}
                      disabled={!isEditing && !!business}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used for the left sidebar background
                  </p>
                </div>
                <div className="md:col-span-2">
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
                    Used for highlights, warnings, and special elements (e.g., warning messages, focus states, badges)
                  </p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-panel-bg, #f8fafc)', color: 'var(--color-panel-text, #1f2937)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Color Preview</p>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-100"
                    onClick={() => {
                      const defaults = { primaryColor: '#3B82F6', secondaryColor: '#FFFFFF', navbarColor: '#FFFFFF', sidebarColor: '#FFFFFF', accentColor: '#F59E0B' };
                      setFormData((prev) => ({ ...prev, ...defaults }));
                      updateBusinessColors(defaults);
                    }}
                  >
                    Reset Default Colors
                  </button>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: formData.primaryColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Primary</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: formData.secondaryColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Secondary</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: formData.navbarColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Navbar</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: formData.sidebarColor }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Sidebar</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
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
                        secondaryColor: business.secondaryColor || "#FFFFFF",
                        navbarColor: business.navbarColor || "#FFFFFF",
                        sidebarColor: business.sidebarColor || "#FFFFFF",
                        accentColor: business.accentColor || "#F59E0B",
                      });
                      setLogoPreview(business.logoUrl || null);
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={() => handleSubmit()}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : business ? "Save Changes" : "Create Business Profile"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
