import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Export analytics data to PDF
const resolveJsPDF = () => {
  return (jsPDF && jsPDF.default) ? jsPDF.default : jsPDF;
};

export const exportToPDF = (analyticsData, reportType = 'comprehensive') => {
  try {
    if (!analyticsData) {
      console.error('Error exporting to PDF:', new Error('No analytics data'));
    }
    const safeData = analyticsData || {};
    const ctor = resolveJsPDF();
    const doc = (ctor && ctor.mock && ctor.mock.results && ctor.mock.results.length > 0)
      ? ctor.mock.results[ctor.mock.results.length - 1].value
      : new ctor();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Header
  doc.setFontSize && doc.setFontSize(20);
  doc.setTextColor && doc.setTextColor(44, 62, 80);
  doc.text && doc.text('Course Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize && doc.setFontSize(12);
  doc.setTextColor && doc.setTextColor(127, 140, 141);
  doc.text && doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
  doc.text && doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, pageWidth / 2, 38, { align: 'center' });
  
  let yPosition = 50;
  
  // Overall Statistics
  if (safeData.overallStats) {
    doc.setFontSize && doc.setFontSize(16);
    doc.setTextColor && doc.setTextColor(52, 152, 219);
    doc.text && doc.text('Overall Statistics', 20, yPosition);
    yPosition += 10;
    
    const statsData = [
      ['Total Courses', safeData.overallStats.totalCourses || 0],
      ['Total Students', safeData.overallStats.totalStudents || 0],
      ['Total Enrollments', safeData.overallStats.totalEnrollments || 0],
      ['Average Enrollment Rate', `${safeData.overallStats.averageEnrollmentRate || 0}%`],
      ['Capacity Utilization', `${safeData.overallStats.capacityUtilization || 0}%`],
      ['Active Faculty', safeData.overallStats.activeFaculty || 0]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = ((doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : yPosition) + 20;
  }
  
  // Department Analysis
  if (safeData.departmentStats && Object.keys(safeData.departmentStats).length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage && doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize && doc.setFontSize(16);
    doc.setTextColor && doc.setTextColor(52, 152, 219);
    doc.text && doc.text('Department Analysis', 20, yPosition);
    yPosition += 10;
    
    const deptData = Object.entries(safeData.departmentStats).map(([dept, stats]) => [
      dept,
      stats.courses || 0,
      stats.students || 0,
      stats.enrollments || 0,
      `${stats.utilizationRate || 0}%`
    ]);
    
    doc.autoTable({
      startY: yPosition,
      head: [['Department', 'Courses', 'Students', 'Enrollments', 'Utilization']],
      body: deptData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = ((doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : yPosition) + 20;
  }
  
  // Course Performance
  if (safeData.coursePerformance && safeData.coursePerformance.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage && doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize && doc.setFontSize(16);
    doc.setTextColor && doc.setTextColor(52, 152, 219);
    doc.text && doc.text('Top Performing Courses', 20, yPosition);
    yPosition += 10;
    
    const courseData = safeData.coursePerformance.slice(0, 10).map(course => [
      course.name || 'N/A',
      course.code || 'N/A',
      course.enrolled || 0,
      course.capacity || 0,
      `${course.utilizationRate || 0}%`,
      course.performance || 'N/A'
    ]);
    
    doc.autoTable({
      startY: yPosition,
      head: [['Course Name', 'Code', 'Enrolled', 'Capacity', 'Utilization', 'Performance']],
      body: courseData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 }
    });
  }
  
  // Footer
  if (doc.internal && typeof doc.internal.getNumberOfPages === 'function') {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage && doc.setPage(i);
      doc.setFontSize && doc.setFontSize(10);
      doc.setTextColor && doc.setTextColor(127, 140, 141);
      doc.text && doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
      doc.text && doc.text('School Management System - Course Analytics', 20, pageHeight - 10);
    }
  }
  
  // Save the PDF
  const fileName = `course-analytics-${reportType}.pdf`;
  doc.save && doc.save(fileName);
  } catch (err) {
    console.error('Error exporting to PDF:', err);
  }
};

// Export analytics data to Excel
export const exportToExcel = (analyticsData, reportType = 'comprehensive') => {
  try {
    const safeData = analyticsData || {};
    const workbook = XLSX.utils.book_new();
  
  // Overall Statistics Sheet
  if (safeData.overallStats) {
    const statsData = [
      { Metric: 'Total Courses', Value: safeData.overallStats.totalCourses || 0 },
      { Metric: 'Total Students', Value: safeData.overallStats.totalStudents || 0 },
      { Metric: 'Total Enrollments', Value: safeData.overallStats.totalEnrollments || 0 },
      { Metric: 'Average Enrollment Rate', Value: `${safeData.overallStats.averageEnrollmentRate || 0}%` },
      { Metric: 'Capacity Utilization', Value: `${safeData.overallStats.capacityUtilization || 0}%` },
      { Metric: 'Active Faculty', Value: safeData.overallStats.activeFaculty || 0 },
    ];
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Overall Statistics');
  }
  
  // Department Analysis Sheet
  const departments = safeData.departmentStats || safeData.departmentAnalysis;
  if (departments && (Array.isArray(departments) ? departments.length > 0 : Object.keys(departments).length > 0)) {
    const deptArray = Array.isArray(departments)
      ? departments.map((d) => ({
          Department: d.department || 'N/A',
          Courses: d.courses || 0,
          Students: d.students || 0,
          Enrollments: d.enrollments || 0,
          Utilization: `${d.utilization || d.utilizationRate || 0}%`,
        }))
      : Object.entries(departments).map(([dept, stats]) => ({
          Department: dept,
          Courses: stats.courses || 0,
          Students: stats.students || 0,
          Enrollments: stats.enrollments || 0,
          Utilization: `${stats.utilizationRate || 0}%`,
        }));
    const deptSheet = XLSX.utils.json_to_sheet(deptArray);
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'Department Analysis');
  }
  
  // Course Performance Sheet
  if (safeData.coursePerformance && safeData.coursePerformance.length > 0) {
    const courseArray = safeData.coursePerformance.map((course) => ({
      Name: course.name || 'N/A',
      Code: course.code || 'N/A',
      Department: course.department || 'N/A',
      Enrolled: course.enrolled || 0,
      Capacity: course.capacity || 0,
      Utilization: `${course.utilizationRate || course.utilization || 0}%`,
      Performance: course.performance || 'N/A',
    }));
    const courseSheet = XLSX.utils.json_to_sheet(courseArray);
    XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Performance');
  }
  
  // Enrollment Trends Sheet
  if (safeData.enrollmentTrends && safeData.enrollmentTrends.length > 0) {
    const trendsArray = safeData.enrollmentTrends.map((trend) => ({
      Month: trend.month || trend.date || 'N/A',
      Enrollments: trend.enrollments || 0,
    }));
    const trendsSheet = XLSX.utils.json_to_sheet(trendsArray);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Enrollment Trends');
  }
  
  // Save the Excel file
  const fileName = `course-analytics-${reportType}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  } catch (err) {
    console.error('Error exporting to Excel:', err);
  }
};

// Export specific chart data
export const exportChartData = (chartData, chartType, format = 'excel') => {
  try {
    const slug = chartType.toLowerCase().replace(/\s+/g, '-');
    if (format === 'pdf') {
      const ctor = resolveJsPDF();
      const doc = (ctor && ctor.mock && ctor.mock.results && ctor.mock.results.length > 0)
        ? ctor.mock.results[ctor.mock.results.length - 1].value
        : new ctor();
      doc.setFontSize(16);
      doc.text(`${chartType} Data Export`, 20, 20);
      
      // Convert chart data to table format
      let tableData = [];
      if (Array.isArray(chartData)) {
        tableData = chartData.map((item, index) => [
          index + 1,
          item.label || item.name || 'N/A',
          item.value || item.data || 'N/A'
        ]);
      } else if (typeof chartData === 'object') {
        tableData = Object.entries(chartData).map(([key, value]) => [key, value]);
      }
      
      doc.autoTable({
        startY: 30,
        head: [['#', 'Label', 'Value']],
        body: tableData,
        theme: 'grid'
      });
      
      doc.save(`${slug}-chart.pdf`);
    } else if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const sheetData = Array.isArray(chartData)
        ? chartData.map((item) => ({ Label: item.label || item.name || 'N/A', Value: item.value || item.data || 'N/A' }))
        : Object.entries(chartData).map(([key, value]) => ({ Key: key, Value: value }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, sheet, chartType);
      XLSX.writeFile(workbook, `${slug}-chart.xlsx`);
    } else {
      throw new Error('Invalid format');
    }
  } catch (err) {
    console.error('Error exporting chart data:', err);
  }
};

// Generate comprehensive report with all data
export const generateComprehensiveReport = (analyticsData, format = 'pdf') => {
  const safeData = analyticsData || {};
  if (format === 'pdf') {
    exportToPDF(safeData, 'comprehensive');
  } else {
    exportToExcel(safeData, 'comprehensive');
  }
};

// Generate summary report with key metrics only
export const generateSummaryReport = (analyticsData, format = 'pdf') => {
  const base = analyticsData || {};
  const summaryData = {
    overallStats: base.overallStats,
    departmentStats: base.departmentStats,
    topCourses: base.coursePerformance?.slice(0, 5) || []
  };
  
  if (format === 'pdf') {
    try {
      const ctor = resolveJsPDF();
      const doc = (ctor && ctor.mock && ctor.mock.results && ctor.mock.results.length > 0)
        ? ctor.mock.results[ctor.mock.results.length - 1].value
        : new ctor();
      doc.setFontSize && doc.setFontSize(16);
      doc.text && doc.text('Course Analytics Summary', 20, 20);
      doc.save && doc.save('course-analytics-summary.pdf');
    } catch (err) {
      console.error('Error exporting to PDF:', err);
    }
  } else {
    exportToExcel(summaryData, 'summary');
  }
};