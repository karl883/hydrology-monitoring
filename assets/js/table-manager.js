/**
 * 表格管理器
 * 负责数据表格的显示、分页和导出
 */

class TableManager {
    constructor() {
        this.tableBody = document.getElementById('dataTableBody');
        this.currentPage = 1;
        this.pageSize = CONFIG.table.pageSize;
        this.totalRecords = 0;
        this.totalPages = 1;
        this.currentData = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.init();
    }
    
    init() {
        if (!this.tableBody) {
            console.error('Table body not found');
            return;
        }
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化表格
        this.renderEmptyTable();
    }
    
    bindEvents() {
        // 分页按钮
        document.getElementById('prevPage')?.addEventListener('click', () => this.prevPage());
        document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
        
        // 导出按钮
        document.getElementById('exportTable')?.addEventListener('click', () => this.exportData());
        
        // 视图切换按钮
        document.getElementById('toggleTableView')?.addEventListener('click', () => this.toggleView());
        
        // 表头点击排序
        this.bindTableHeaderEvents();
    }
    
    bindTableHeaderEvents() {
        const headers = document.querySelectorAll('thead th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => this.sortTable(index));
        });
    }
    
    async updateTable(data, options = {}) {
        if (!data || !data.data) {
            this.renderEmptyTable();
            return;
        }
        
        // 保存当前数据
        this.currentData = data.data;
        this.totalRecords = this.currentData.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        
        // 应用筛选（如果有）
        if (options.filter) {
            this.currentData = this.filterData(this.currentData, options.filter);
            this.totalRecords = this.currentData.length;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        }
        
        // 应用排序（如果有）
        if (this.sortColumn !== null) {
            this.sortData(this.sortColumn, this.sortDirection);
        }
        
        // 重置到第一页
        this.currentPage = 1;
        
        // 渲染表格
        this.renderTable();
        
        // 更新分页信息
        this.updatePaginationInfo();
    }
    
    filterData(data, filter) {
        return data.filter(item => {
            // 按水库筛选
            if (filter.reservoirs && filter.reservoirs.length > 0) {
                if (!filter.reservoirs.includes(item.reservoir_name)) {
                    return false;
                }
            }
            
            // 按时间范围筛选
            if (filter.startTime || filter.endTime) {
                const itemTime = new Date(item.timestamp).getTime();
                
                if (filter.startTime && itemTime < filter.startTime) {
                    return false;
                }
                
                if (filter.endTime && itemTime > filter.endTime) {
                    return false;
                }
            }
            
            // 按指标值筛选
            if (filter.minValue || filter.maxValue) {
                const value = item[filter.indicator];
                
                if (value !== null && value !== undefined) {
                    if (filter.minValue && value < filter.minValue) {
                        return false;
                    }
                    
                    if (filter.maxValue && value > filter.maxValue) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    }
    
    sortTable(columnIndex) {
        const columns = ['timestamp', 'reservoir_name', 'water_level', 'inflow', 'outflow', 'storage'];
        
        if (columnIndex >= 0 && columnIndex < columns.length) {
            const column = columns[columnIndex];
            
            // 切换排序方向
            if (this.sortColumn === column) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
            
            // 排序数据
            this.sortData(column, this.sortDirection);
            
            // 重新渲染表格
            this.renderTable();
            
            // 更新表头样式
            this.updateHeaderSortIndicator(columnIndex);
        }
    }
    
    sortData(column, direction) {
        this.currentData.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];
            
            // 处理时间字段
            if (column === 'timestamp') {
                valueA = new Date(valueA).getTime();
                valueB = new Date(valueB).getTime();
            }
            
            // 处理可能为null的值
            if (valueA === null || valueA === undefined) valueA = direction === 'asc' ? Infinity : -Infinity;
            if (valueB === null || valueB === undefined) valueB = direction === 'asc' ? Infinity : -Infinity;
            
            // 排序
            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }
    
    updateHeaderSortIndicator(columnIndex) {
        // 清除所有排序指示器
        const headers = document.querySelectorAll('thead th');
        headers.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        // 添加当前排序指示器
        if (columnIndex >= 0 && columnIndex < headers.length) {
            const header = headers[columnIndex];
            header.classList.add(`sort-${this.sortDirection}`);
        }
    }
    
    renderTable() {
        if (!this.tableBody) return;
        
        // 清空表格
        this.tableBody.innerHTML = '';
        
        // 计算当前页的数据范围
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.currentData.length);
        const pageData = this.currentData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            this.renderEmptyTable();
            return;
        }
        
        // 渲染数据行
        pageData.forEach((item, index) => {
            const row = this.createTableRow(item, startIndex + index + 1);
            this.tableBody.appendChild(row);
        });
    }
    
    createTableRow(data, rowNumber) {
        const row = document.createElement('tr');
        
        // 行号（可选）
        if (rowNumber) {
            const numberCell = document.createElement('td');
            numberCell.textContent = rowNumber;
            numberCell.style.color = '#8c98a4';
            numberCell.style.fontSize = '12px';
            row.appendChild(numberCell);
        }
        
        // 时间
        const timeCell = document.createElement('td');
        timeCell.textContent = this.formatTime(data.timestamp);
        row.appendChild(timeCell);
        
        // 水库名称（带颜色标识）
        const reservoirCell = document.createElement('td');
        reservoirCell.className = 'reservoir-name';
        
        const colorDot = document.createElement('span');
        colorDot.className = 'reservoir-color';
        colorDot.style.backgroundColor = CONFIG.charts.reservoirColors[data.reservoir_name] || CONFIG.charts.colors.primary;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = data.reservoir_name;
        
        reservoirCell.appendChild(colorDot);
        reservoirCell.appendChild(nameSpan);
        row.appendChild(reservoirCell);
        
        // 水位
        const waterCell = document.createElement('td');
        waterCell.textContent = data.water_level !== null ? data.water_level.toFixed(1) : '--';
        waterCell.style.fontWeight = '600';
        waterCell.style.color = this.getValueColor(data.water_level, 'water_level');
        row.appendChild(waterCell);
        
        // 入库流量
        const inflowCell = document.createElement('td');
        inflowCell.textContent = data.inflow !== null ? data.inflow.toFixed(1) : '--';
        inflowCell.style.color = this.getValueColor(data.inflow, 'inflow');
        row.appendChild(inflowCell);
        
        // 出库流量
        const outflowCell = document.createElement('td');
        outflowCell.textContent = data.outflow !== null ? data.outflow.toFixed(1) : '--';
        outflowCell.style.color = this.getValueColor(data.outflow, 'outflow');
        row.appendChild(outflowCell);
        
        // 蓄水量
        const storageCell = document.createElement('td');
        storageCell.textContent = data.storage !== null ? this.formatStorage(data.storage) : '--';
        storageCell.style.fontWeight = '600';
        row.appendChild(storageCell);
        
        // 添加悬停效果
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = 'rgba(24, 144, 255, 0.05)';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });
        
        // 点击显示详情
        row.addEventListener('click', () => {
            this.showRowDetail(data);
        });
        
        return row;
    }
    
    getValueColor(value, indicator) {
        if (value === null || value === undefined) {
            return '#8c98a4';
        }
        
        const indicatorConfig = CONFIG.reservoirs.indicators[indicator];
        if (!indicatorConfig) return '#ffffff';
        
        // 根据值的大小返回不同颜色
        const percentage = (value - indicatorConfig.min) / (indicatorConfig.max - indicatorConfig.min);
        
        if (percentage < 0.3) return '#52c41a'; // 低 - 绿色
        if (percentage < 0.7) return '#faad14'; // 中 - 黄色
        return '#ff4d4f'; // 高 - 红色
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatStorage(value) {
        if (value >= 10000) {
            return (value / 10000).toFixed(1) + '亿';
        }
        return value.toLocaleString('zh-CN');
    }
    
    renderEmptyTable() {
        if (!this.tableBody) return;
        
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #8c98a4;">
                    <i class="fas fa-database" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
                    <div>暂无数据</div>
                    <div style="font-size: 12px; margin-top: 8px;">请加载数据或调整筛选条件</div>
                </td>
            </tr>
        `;
    }
    
    showRowDetail(data) {
        // 创建详情弹窗
        const detailHtml = `
            <div class="row-detail">
                <h3>${data.reservoir_name}</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">时间:</span>
                        <span class="detail-value">${new Date(data.timestamp).toLocaleString('zh-CN')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">水位:</span>
                        <span class="detail-value">${data.water_level !== null ? data.water_level.toFixed(1) + ' m' : '--'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">入库流量:</span>
                        <span class="detail-value">${data.inflow !== null ? data.inflow.toFixed(1) + ' m³/s' : '--'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">出库流量:</span>
                        <span class="detail-value">${data.outflow !== null ? data.outflow.toFixed(1) + ' m³/s' : '--'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">蓄水量:</span>
                        <span class="detail-value">${data.storage !== null ? this.formatStorage(data.storage) + ' m³' : '--'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // 显示弹窗（这里可以替换为更优雅的弹窗组件）
        this.showModal('数据详情', detailHtml);
    }
    
    showModal(title, content) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }
    
    // 分页控制
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
            this.updatePaginationInfo();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderTable();
            this.updatePaginationInfo();
        }
    }
    
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.updatePaginationInfo();
        }
    }
    
    updatePaginationInfo() {
        const currentPageEl = document.getElementById('currentPage');
        const totalPagesEl = document.getElementById('totalPages');
        const totalRecordsEl = document.getElementById('totalRecords');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (currentPageEl) currentPageEl.textContent = this.currentPage;
        if (totalPagesEl) totalPagesEl.textContent = this.totalPages;
        if (totalRecordsEl) totalRecordsEl.textContent = this.totalRecords.toLocaleString('zh-CN');
        
        // 更新按钮状态
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.style.opacity = this.currentPage <= 1 ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
            nextBtn.style.opacity = this.currentPage >= this.totalPages ? '0.5' : '1';
        }
    }
    
    // 导出数据
    exportData(format = 'csv') {
        if (this.currentData.length === 0) {
            this.showToast('没有数据可以导出', 'warning');
            return;
        }
        
        switch (format.toLowerCase()) {
            case 'csv':
                this.exportToCSV();
                break;
            case 'json':
                this.exportToJSON();
                break;
            case 'excel':
                this.exportToExcel();
                break;
            default:
                this.showToast('不支持的导出格式', 'error');
        }
    }
    
    exportToCSV() {
        if (this.currentData.length === 0) return;
        
        // 准备CSV内容
        const headers = ['时间', '水库', '水位(m)', '入库流量(m³/s)', '出库流量(m³/s)', '蓄水量(万m³)'];
        const rows = this.currentData.map(item => [
            this.formatTime(item.timestamp),
            item.reservoir_name,
            item.water_level !== null ? item.water_level.toFixed(1) : '',
            item.inflow !== null ? item.inflow.toFixed(1) : '',
            item.outflow !== null ? item.outflow.toFixed(1) : '',
            item.storage !== null ? item.storage : ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // 创建下载链接
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `水文监测数据_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        this.showToast('数据已导出为CSV文件', 'success');
    }
    
    exportToJSON() {
        const data = {
            exported_at: new Date().toISOString(),
            total_records: this.currentData.length,
            data: this.currentData
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `水文监测数据_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        this.showToast('数据已导出为JSON文件', 'success');
    }
    
    exportToExcel() {
        // 注意：Excel导出需要服务器端支持或使用第三方库
        // 这里提供一个简单的CSV导出，可以在Excel中打开
        this.exportToCSV();
        this.showToast('数据已导出为CSV文件（可在Excel中打开）', 'success');
    }
    
    // 视图切换
    toggleView() {
        const tableContainer = document.querySelector('.table-container');
        const isCardView = tableContainer.classList.contains('card-view');
        
        if (isCardView) {
            // 切换到表格视图
            tableContainer.classList.remove('card-view');
            this.showToast('切换到表格视图', 'info');
        } else {
            // 切换到卡片视图
            tableContainer.classList.add('card-view');
            this.renderCardView();
            this.showToast('切换到卡片视图', 'info');
        }
    }
    
    renderCardView() {
        // 这里可以实现卡片视图的渲染
        // 由于时间关系，暂时只切换类名
        console.log('切换到卡片视图');
    }
    
    // 工具方法
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            // 显示动画
            setTimeout(() => toast.classList.add('show'), 10);
            
            // 3秒后移除
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    // 更新页面大小
    setPageSize(size) {
        if (size > 0 && size <= 100) {
            this.pageSize = size;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            
            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
            }
            
            this.renderTable();
            this.updatePaginationInfo();
        }
    }
    
    // 获取当前页数据
    getCurrentPageData() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.currentData.length);
        return this.currentData.slice(startIndex, endIndex);
    }
    
    // 搜索功能
    search(query) {
        if (!query) {
            // 重置搜索
            this.currentData = this.originalData || this.currentData;
        } else {
            // 执行搜索
            const lowerQuery = query.toLowerCase();
            this.currentData = (this.originalData || this.currentData).filter(item => {
                return Object.values(item).some(value => {
                    if (value === null || value === undefined) return false;
                    return value.toString().toLowerCase().includes(lowerQuery);
                });
            });
        }
        
        this.totalRecords = this.currentData.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = 1;
        
        this.renderTable();
        this.updatePaginationInfo();
    }
    
    // 清空表格
    clear() {
        this.currentData = [];
        this.totalRecords = 0;
        this.totalPages = 1;
        this.currentPage = 1;
        
        this.renderEmptyTable();
        this.updatePaginationInfo();
    }
}

// 创建全局实例
const tableManager = new TableManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableManager;
} else {
    window.tableManager = tableManager;
}