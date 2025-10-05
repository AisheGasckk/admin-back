import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import PdfReportTable from "./PdfReportTable";
import AcademicYearBadge from "../components/AcademicYearBadge";

const PdfDownload = () => {
  const pdfContentRef = useRef();
  const [downloading, setDownloading] = useState(false);
  const [basicInfo, setBasicInfo] = useState({});
  const [officeDetails, setOfficeDetails] = useState({});
  const [addressDetails, setAddressDetails] = useState({});
  const [departmentEnrollment, setDepartmentEnrollment] = useState([]);
  const [departmentExamination, setDepartmentExamination] = useState([]);
  const [teachingStaff, setTeachingStaff] = useState([]);
  const [nonTeachingStaff, setNonTeachingStaff] = useState([]);
  const [sections, setSections] = useState({
    basic: true,
    office: true,
    address: true,
    enrollment: true,
    examination: true,
    teaching: true,
    nonTeaching: true
  });
  const [showPreview, setShowPreview] = useState(false);
  const academicYearOptions = ["2024-2025", "2025-2026", "2026-2027", ];
  const [academicYears] = useState(academicYearOptions);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYearOptions[0]);
  const [latestAcademicYear, setLatestAcademicYear] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    axios.get("https://admin-back-j3j4.onrender.com/api/office/basic-information", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBasicInfo(res.data.data || {}));
    axios.get("https://admin-back-j3j4.onrender.com/api/office/office-details", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOfficeDetails(res.data.data || {}));
    axios.get("https://admin-back-j3j4.onrender.com/api/office/institution-address", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAddressDetails(res.data.data || {}));

    // Template summaries: include academic year as query param so backend can filter
    axios.get("https://admin-back-j3j4.onrender.com/api/template/department-enrollment-summary", {
      headers: { Authorization: `Bearer ${token}` },
      params: { academic_year: selectedAcademicYear }
    }).then(res => setDepartmentEnrollment(res.data.summary || []));

    axios.get("https://admin-back-j3j4.onrender.com/api/template/department-examination-summary", {
      headers: { Authorization: `Bearer ${token}` },
      params: { academic_year: selectedAcademicYear }
    }).then(res => setDepartmentExamination(res.data.summary || []));

    axios.get("https://admin-back-j3j4.onrender.com/api/template/teaching-staff-summary", {
      headers: { Authorization: `Bearer ${token}` },
      params: { academic_year: selectedAcademicYear }
    }).then(res => setTeachingStaff(res.data.summary || []));

    axios.get("https://admin-back-j3j4.onrender.com/api/template/non-teaching-staff-summary", {
      headers: { Authorization: `Bearer ${token}` },
      params: { academic_year: selectedAcademicYear }
    }).then(res => setNonTeachingStaff(res.data.summary || []));
  }, [selectedAcademicYear]);


  useEffect(() => {
    async function fetchAdminAcademicYear() {
      try {
        const res = await axios.get("https://admin-back-j3j4.onrender.com/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        if (res.data?.admins?.length) {
          setLatestAcademicYear(res.data.admins[0].academic_year || "");
        }
      } catch {
        setLatestAcademicYear("");
      }
    }
    fetchAdminAcademicYear();
  }, []);

  const handleSectionChange = (e) => {
    setSections({ ...sections, [e.target.name]: e.target.checked });
  };

  const handleDownload = async () => {
    setDownloading(true);
    const input = pdfContentRef.current;
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff"
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    if (pdfHeight <= pageHeight - 20) {
      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
    } else {
      let position = 10;
      let pageCanvasHeight = Math.floor((pageHeight - 20) * (imgProps.width / pdfWidth));
      let renderedHeight = 0;
      while (renderedHeight < imgProps.height) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgProps.width;
        pageCanvas.height = pageCanvasHeight;
        const pageCtx = pageCanvas.getContext('2d');
        pageCtx.fillStyle = '#fff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          renderedHeight,
          imgProps.width,
          pageCanvasHeight,
          0,
          0,
          imgProps.width,
          pageCanvasHeight
        );
        const pageImgData = pageCanvas.toDataURL('image/png');
        if (renderedHeight === 0) {
          pdf.addImage(pageImgData, 'PNG', 10, 10, pdfWidth, pageHeight - 20);
        } else {
          pdf.addPage();
          pdf.addImage(pageImgData, 'PNG', 10, 10, pdfWidth, pageHeight - 20);
        }
        renderedHeight += pageCanvasHeight;
      }
    }
    pdf.save(`InstitutionDetails_${selectedAcademicYear}.pdf`);
    setDownloading(false);
  };

  const renderPdfTable = () => (
    <PdfReportTable
      basicInfo={basicInfo}
      officeDetails={officeDetails}
      addressDetails={addressDetails}
      departmentEnrollment={departmentEnrollment}
      departmentExamination={departmentExamination}
      teachingStaff={teachingStaff}
      nonTeachingStaff={nonTeachingStaff}
      sections={sections}
      selectedAcademicYear={selectedAcademicYear}
    />
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100">
      <div className="w-full flex justify-end pr-8 pt-8">
        <AcademicYearBadge year={latestAcademicYear} />
      </div>
      <div className="relative w-full max-w-4xl mx-auto rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
          boxShadow: "0 8px 32px 0 rgba(31, 41, 55, 0.12)",
        }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 80% 20%, #a5b4fc33 0%, #fff0 70%)"
        }} />
        <div className="relative p-10">
          <h2 className="text-4xl font-extrabold text-indigo-900 text-center mb-2 tracking-tight drop-shadow-lg">
            Institution PDF Report
          </h2>
          <p className="text-lg text-gray-500 text-center mb-8 font-medium">
            Select the academic year and sections to include in your PDF report.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-3 bg-white rounded-xl shadow px-5 py-3 border border-indigo-200">
              <label className="text-indigo-700 text-lg font-semibold">Academic Year:</label>
              <select
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                className="px-4 py-2 rounded-xl border border-indigo-300 bg-indigo-50 shadow text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {academicYearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="basic"
                  checked={sections.basic}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Basic Information
              </label>
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="office"
                  checked={sections.office}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Office Details
              </label>
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="address"
                  checked={sections.address}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Address Details
              </label>
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="enrollment"
                  checked={sections.enrollment}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Student Enrollment
              </label>
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="examination"
                  checked={sections.examination}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Student Examination
              </label>
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="teaching"
                  checked={sections.teaching}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Teaching Staff
              </label>
              <label className="text-indigo-700 text-lg font-semibold">
                <input
                  type="checkbox"
                  name="nonTeaching"
                  checked={sections.nonTeaching}
                  onChange={handleSectionChange}
                  className="mr-2 accent-indigo-600 scale-125"
                />
                Non-Teaching Staff
              </label>
            </div>
          </div>
          <div className="flex justify-center gap-6 mb-8">
            <button
              className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:scale-105 hover:from-indigo-600 hover:to-blue-600 transition-all text-xl flex items-center gap-3"
              onClick={handleDownload}
              disabled={downloading}
            >
              <FaDownload className="text-2xl" />
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button
              className="bg-white text-indigo-600 px-4 py-4 rounded-2xl shadow-lg hover:bg-indigo-50 transition-all text-xl flex items-center gap-2"
              onClick={() => setShowPreview(true)}
              title="Preview PDF"
              style={{ minWidth: 56, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <FaEye />
            </button>
          </div>
          {/* Hidden content for PDF capture */}
          <div
            ref={pdfContentRef}
            style={{
              padding: "40px",
              background: "#fff",
              width: "800px",
              minHeight: "1120px",
              boxSizing: "border-box",
              position: "absolute",
              left: "-9999px",
              top: 0
            }}
          >
            {renderPdfTable()}
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-gray-400 text-sm">
        <span>
          PDF matches the portal layout. For best results, open in Adobe Reader or Chrome.
        </span>
      </div>
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full relative overflow-auto" style={{ maxHeight: "90vh" }}>
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
              onClick={() => setShowPreview(false)}
            >×</button>
            {renderPdfTable()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfDownload;