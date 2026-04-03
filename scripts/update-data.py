#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
水文监测数据更新脚本
从多个数据源获取最新数据并更新到GitHub
"""

import os
import json
import pandas as pd
import requests
from datetime import datetime, timedelta
from pathlib import Path
import hashlib
import sys

class DataUpdater:
    def __init__(self):
        self.data_dir = Path('data')
        self.sources_dir = Path('data/sources')
        self.backup_dir = Path('data/backup')
        
        # 创建必要的目录
        self.data_dir.mkdir(exist_ok=True)
        self.sources_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        # 配置
        self.config = self.load_config()
        
    def load_config(self):
        """加载配置文件"""
        config_path = self.data_dir / 'config.json'
        if config_path.exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {
                'version': '1.0.0',
                'last_updated': None,
                'data_sources': [],
                'update_settings': {
                    'frequency': '6h',
                    'retry_count': 3,
                    'timeout': 30
                }
            }
    
    def save_config(self):
        """保存配置文件"""
        self.config['last_updated'] = datetime.now().isoformat()
        config_path = self.data_dir / 'config.json'
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def backup_existing_data(self):
        """备份现有数据"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = self.backup_dir / timestamp
        
        backup_path.mkdir(exist_ok=True)
        
        # 备份数据文件
        for file in self.data_dir.glob('*.json'):
            if file.name != 'config.json':
                backup_file = backup_path / file.name
                file.rename(backup_file)
                print(f"Backed up: {file.name}")
        
        # 保留最近的5个备份
        self.cleanup_old_backups()
    
    def cleanup_old_backups(self):
        """清理旧的备份"""
        backups = sorted(self.backup_dir.iterdir(), key=os.path.getmtime)
        if len(backups) > 5:
            for old_backup in backups[:-5]:
                import shutil
                shutil.rmtree(old_backup)
                print(f"Removed old backup: {old_backup.name}")
    
    def fetch_from_api(self, api_url, params=None):
        """从API获取数据"""
        try:
            headers = {
                'User-Agent': 'Hydrology-Monitoring-Bot/1.0',
                'Accept': 'application/json'
            }
            
            response = requests.get(
                api_url, 
                params=params, 
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"API request failed: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error fetching from API: {e}")
            return None
    
    def process_excel_data(self, file_path):
        """处理Excel数据文件"""
        try:
            # 读取Excel文件
            df = pd.read_excel(file_path)
            
            # 基础信息
            file_info = {
                'filename': os.path.basename(file_path),
                'rows': len(df),
                'columns': list(df.columns),
                'processed_at': datetime.now().isoformat()
            }
            
            # 保存原始数据
            source_file = self.sources_dir / f"{os.path.basename(file_path)}.json"
            df.to_json(source_file, orient='records', force_ascii=False)
            
            return file_info
            
        except Exception as e:
            print(f"Error processing Excel file: {e}")
            return None
    
    def generate_sample_data(self):
        """生成示例数据（用于测试）"""
        print("Generating sample data...")
        
        # 水库基本信息
        reservoirs = [
            {
                'id': 'res_001',
                'name': '宝珠寺水库',
                'code': 'BZS001',
                'basin': '嘉陵江流域',
                'location': {'lat': 32.1234, 'lng': 105.6789},
                'capacity': 256000,
                'status': 'normal',
                'color': '#1890ff'
            },
            {
                'id': 'res_002',
                'name': '紫坪铺水库',
                'code': 'ZPP002',
                'basin': '岷江流域',
                'location': {'lat': 31.2345, 'lng': 103.7890},
                'capacity': 112400,
                'status': 'normal',
                'color': '#52c41a'
            },
            {
                'id': 'res_003',
                'name': '亭子口水库',
                'code': 'TZK003',
                'basin': '嘉陵江流域',
                'location': {'lat': 32.3456, 'lng': 106.8901},
                'capacity': 412000,
                'status': 'normal',
                'color': '#faad14'
            }
        ]
        
        # 生成时间序列数据
        time_series = []
        base_time = datetime.now() - timedelta(days=30)
        
        for i in range(720):  # 30天，每小时一个点
            timestamp = base_time + timedelta(hours=i)
            
            for reservoir in reservoirs:
                # 生成模拟数据
                hour_of_day = timestamp.hour
                day_of_week = timestamp.weekday()
                
                # 基础值 + 周期性变化
                base_water = 580 + (ord(reservoir['id'][-1]) % 100)
                water_level = base_water + 5 * (hour_of_day / 24) + 2 * (day_of_week / 7)
                
                base_inflow = 280 + (ord(reservoir['id'][-1]) % 50)
                inflow = base_inflow + 20 * (hour_of_day / 24) + 10 * (day_of_week / 7)
                
                base_outflow = 390 + (ord(reservoir['id'][-1]) % 60)
                outflow = base_outflow + 15 * (hour_of_day / 24) + 8 * (day_of_week / 7)
                
                base_storage = 1950000 + (ord(reservoir['id'][-1]) % 100000)
                storage = base_storage + 5000 * (hour_of_day / 24) + 2000 * (day_of_week / 7)
                
                # 添加一些随机波动
                import random
                water_level += random.uniform(-0.5, 0.5)
                inflow += random.uniform(-5, 5)
                outflow += random.uniform(-5, 5)
                storage += random.uniform(-100, 100)
                
                record = {
                    'timestamp': timestamp.isoformat(),
                    'reservoir_id': reservoir['id'],
                    'reservoir_name': reservoir['name'],
                    'water_level': round(water_level, 2),
                    'inflow': round(inflow, 1),
                    'outflow': round(outflow, 1),
                    'storage': round(storage, 0)
                }
                
                time_series.append(record)
        
        # 保存数据
        reservoirs_data = {
            'reservoirs': reservoirs,
            'count': len(reservoirs),
            'updated_at': datetime.now().isoformat()
        }
        
        time_series_data = {
            'data': time_series,
            'total_records': len(time_series),
            'time_range': {
                'start': time_series[0]['timestamp'],
                'end': time_series[-1]['timestamp']
            },
            'updated_at': datetime.now().isoformat()
        }
        
        # 生成数据摘要
        summary = {
            'total_reservoirs': len(reservoirs),
            'total_records': len(time_series),
            'time_range': {
                'start': time_series[0]['timestamp'],
                'end': time_series[-1]['timestamp']
            },
            'data_size_kb': (len(json.dumps(time_series)) + len(json.dumps(reservoirs_data))) / 1024,
            'last_updated': datetime.now().isoformat()
        }
        
        return reservoirs_data, time_series_data, summary
    
    def save_data_files(self, reservoirs_data, time_series_data, summary):
        """保存数据文件"""
        # 保存水库数据
        with open(self.data_dir / 'reservoirs.json', 'w', encoding='utf-8') as f:
            json.dump(reservoirs_data, f, ensure_ascii=False, indent=2)
        
        # 保存时间序列数据
        with open(self.data_dir / 'time_series.json', 'w', encoding='utf-8') as f:
            json.dump(time_series_data, f, ensure_ascii=False, indent=2)
        
        # 保存摘要
        with open(self.data_dir / 'summary.json', 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"Saved data files:")
        print(f"  - reservoirs.json ({len(reservoirs_data['reservoirs'])} reservoirs)")
        print(f"  - time_series.json ({time_series_data['total_records']} records)")
        print(f"  - summary.json")
    
    def check_for_changes(self, new_data, old_data_file):
        """检查数据是否有变化"""
        if not old_data_file.exists():
            return True
        
        try:
            with open(old_data_file, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
            
            # 计算哈希值进行比较
            new_hash = hashlib.md5(json.dumps(new_data, sort_keys=True).encode()).hexdigest()
            old_hash = hashlib.md5(json.dumps(old_data, sort_keys=True).encode()).hexdigest()
            
            return new_hash != old_hash
            
        except Exception as e:
            print(f"Error checking for changes: {e}")
            return True
    
    def run(self, force_update=False):
        """运行数据更新"""
        print("=" * 60)
        print("Hydrological Data Updater")
        print(f"Started at: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # 备份现有数据
        self.backup_existing_data()
        
        # 生成或获取数据
        print("\n[1] Generating/updating data...")
        reservoirs_data, time_series_data, summary = self.generate_sample_data()
        
        # 检查是否需要更新
        should_update = force_update
        
        if not should_update:
            should_update = self.check_for_changes(
                reservoirs_data, 
                self.data_dir / 'reservoirs.json'
            ) or self.check_for_changes(
                time_series_data,
                self.data_dir / 'time_series.json'
            )
        
        if should_update or force_update:
            # 保存数据文件
            self.save_data_files(reservoirs_data, time_series_data, summary)
            
            # 更新配置
            self.save_config()
            
            print(f"\n✅ Data updated successfully!")
            print(f"   Last update: {self.config['last_updated']}")
            return True
        else:
            print(f"\nℹ️ No data changes detected. Skipping update.")
            return False

def main():
    # 检查是否强制更新
    force_update = os.environ.get('FORCE_UPDATE', 'false').lower() == 'true'
    
    updater = DataUpdater()
    updated = updater.run(force_update)
    
    if updated:
        print("\n" + "=" * 60)
        print("Update completed successfully!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("No update needed.")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()