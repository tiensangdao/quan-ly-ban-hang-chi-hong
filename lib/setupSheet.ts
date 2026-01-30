'use server';
import { google } from 'googleapis';

// Types for additional tables
interface TopProduct {
    product: string;
    unit: string;
    quantity: number;
    revenue: number;
    profit: number;
}

interface InventoryItem {
    product: string;
    unit: string;
    totalIn: number;
    totalOut: number;
    stock: number;
    value: number;
}

// Setup complete sheet structure with formulas and formatting
export async function setupYearSheet(
    year: number,
    topProducts?: TopProduct[],
    inventory?: InventoryItem[],
    dataRowCount?: number // Number of data rows (excluding header)
) {
    try {
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const base64Key = process.env.GOOGLE_PRIVATE_KEY_BASE64;
        const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (!clientEmail) throw new Error('Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL');

        let privateKey = '';
        if (base64Key) {
            privateKey = atob(base64Key);
        } else if (rawPrivateKey) {
            privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
        }

        if (!privateKey) throw new Error('Không tìm thấy Private Key');
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const sheetName = `${year}`;

        // 1. CREATE SHEET IF NOT EXISTS
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 20,
                                    frozenRowCount: 1, // Freeze header row
                                }
                            }
                        }
                    }]
                }
            });
        } catch (e: any) {
            // Sheet already exists, that's fine
            console.log('Sheet already exists or error:', e.message);
        }

        // 2. SETUP MAIN TABLE HEADER (Row 1)
        const headerRow = [
            'STT', 'Ngày', 'Loại', 'Sản phẩm', 'Đơn vị',
            'Số lượng', 'Đơn giá', 'Thành tiền', 'Lãi',
            'Khách/NCC', 'Ghi chú', 'Tháng'
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1:L1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [headerRow]
            }
        });


        // Formulas removed - values are now calculated server-side

        const sheetId = await getSheetId(sheets, spreadsheetId!, sheetName);

        const formatRequests = [
            // Header row formatting (A1:L1)
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 12
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.09, green: 0.46, blue: 0.82 }, // #1976D2
                            textFormat: {
                                foregroundColor: { red: 1, green: 1, blue: 1 },
                                bold: true,
                                fontSize: 11
                            },
                            horizontalAlignment: 'CENTER'
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
                }
            },
            // Conditional formatting for "Loại" column (C2:C)
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId,
                            startRowIndex: 1,
                            startColumnIndex: 2,
                            endColumnIndex: 3
                        }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'NHẬP' }]
                            },
                            format: {
                                backgroundColor: { red: 1, green: 0.92, blue: 0.93 }, // #FFEBEE
                                textFormat: {
                                    foregroundColor: { red: 0.78, green: 0.16, blue: 0.16 } // #C62828
                                }
                            }
                        }
                    },
                    index: 0
                }
            },
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId,
                            startRowIndex: 1,
                            startColumnIndex: 2,
                            endColumnIndex: 3
                        }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'BÁN' }]
                            },
                            format: {
                                backgroundColor: { red: 0.91, green: 0.96, blue: 0.91 }, // #E8F5E9
                                textFormat: {
                                    foregroundColor: { red: 0.18, green: 0.49, blue: 0.2 } // #2E7D32
                                }
                            }
                        }
                    },
                    index: 1
                }
            },
            // Conditional formatting for "Lãi" column (I2:I) - green if > 0
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId,
                            startRowIndex: 1,
                            startColumnIndex: 8,
                            endColumnIndex: 9
                        }],
                        booleanRule: {
                            condition: {
                                type: 'NUMBER_GREATER',
                                values: [{ userEnteredValue: '0' }]
                            },
                            format: {
                                textFormat: {
                                    foregroundColor: { red: 0.3, green: 0.69, blue: 0.31 } // #4CAF50
                                }
                            }
                        }
                    },
                    index: 2
                }
            },

        ];

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: formatRequests
            }
        });

        return {
            success: true,
            message: `Sheet "${sheetName}" đã được setup header và formatting!`
        };

    } catch (error: any) {
        console.error('Setup sheet error:', error);
        return { success: false, error: error.message };
    }
}

// Write Top Products, Type Stats, and Inventory tables AFTER data is written
export async function writeYearSummaryTables(
    year: number,
    topProducts: { product: string; unit: string; quantity: number; revenue: number; profit: number }[],
    inventory: { product: string; unit: string; totalIn: number; totalOut: number; stock: number; value: number; revenue?: number; profit?: number }[],
    typeStats: { type: string; count: number; total: number }[],
    dataRowCount: number
) {
    try {
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const base64Key = process.env.GOOGLE_PRIVATE_KEY_BASE64;
        const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (!clientEmail) throw new Error('Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL');

        let privateKey = '';
        if (base64Key) {
            privateKey = atob(base64Key);
        } else if (rawPrivateKey) {
            privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
        }

        if (!privateKey) throw new Error('Không tìm thấy Private Key');
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const sheetName = `${year}`;

        // Start row for Top Products (2 rows below data)
        const startRow = dataRowCount + 3; // +1 header +2 gap

        // 1. Write Top Products table (Left side: A-E)
        if (topProducts && topProducts.length > 0) {
            const topProductsHeader = [
                [`🏆 TOP SẢN PHẨM BÁN CHẠY NĂM ${year}`, '', '', '', ''],
                ['STT', 'Sản phẩm', 'Số lượng', 'Doanh thu', 'Lãi']
            ];

            const topProductsRows = topProducts.slice(0, 10).map((p, i) => [
                i + 1,
                p.product,
                `${p.quantity} ${p.unit}`,
                p.revenue,
                p.profit
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A${startRow}:E${startRow + 1}`,
                valueInputOption: 'RAW',
                requestBody: { values: topProductsHeader }
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A${startRow + 2}:E${startRow + 2 + topProductsRows.length - 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: topProductsRows }
            });

            console.log(`✅ Top Products từ row ${startRow}`);
        }

        // 2. Write Type Stats table (Right side of Top Products: G-I)
        if (typeStats && typeStats.length > 0) {
            const typeHeader = [
                ['📊 THỐNG KÊ THEO LOẠI', '', ''],
                ['Loại', 'Số đơn', 'Tổng tiền']
            ];

            const typeRows = typeStats.map(t => [
                t.type,
                t.count,
                t.total
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!H${startRow}:J${startRow + 1}`,
                valueInputOption: 'RAW',
                requestBody: { values: typeHeader }
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!H${startRow + 2}:J${startRow + 2 + typeRows.length - 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: typeRows }
            });

            console.log(`✅ Type Stats từ row ${startRow} column H`);
        }

        // 3. Write Full Inventory/Product Performance table (Below Top Products)
        // Includes Stock + Revenue + Profit
        if (inventory && inventory.length > 0) {
            const topProductsCount = topProducts?.length || 0;
            // Gap depends on which table is longer (Top Products or Type Stats).
            // Type Stats is only 2 rows + header. Top products is 10 rows.
            // So we can stick to using topProductsCount for row calculation.
            const inventoryStartRow = startRow + (topProductsCount > 5 ? topProductsCount : 5) + 5;

            const inventoryHeader = [
                ['📦 THỐNG KÊ CHI TIẾT SẢN PHẨM', '', '', '', '', '', '', '', ''],
                ['STT', 'Sản phẩm', 'Đơn vị', 'Tổng nhập', 'Tổng bán', 'Tồn kho', 'Giá trị tồn', 'Doanh thu', 'Lợi nhuận']
            ];

            const inventoryRows = inventory.map((item, index) => [
                index + 1,
                item.product,
                item.unit,
                item.totalIn,
                item.totalOut,
                item.stock,
                item.value,
                item.revenue || 0,
                item.profit || 0
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A${inventoryStartRow}:I${inventoryStartRow + 1}`,
                valueInputOption: 'RAW',
                requestBody: { values: inventoryHeader }
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A${inventoryStartRow + 2}:I${inventoryStartRow + 2 + inventoryRows.length - 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: inventoryRows }
            });

            console.log(`✅ Detailed Stats từ row ${inventoryStartRow}`);

            // Write Monthly Statistics table (below Inventory)
            const monthlyStartRow = inventoryStartRow + inventoryRows.length + 5;
            const monthlyHeader = [
                ['📅 THỐNG KÊ THÁNG NĂM ' + year, '', '', '', '', ''],
                ['Tháng', 'Tổng nhập', 'Tổng bán', 'Lợi nhuận']
            ];

            const monthlyRows = [];
            for (let m = 1; m <= 12; m++) {
                monthlyRows.push([
                    `Tháng ${m}`,
                    `=SUMIFS($H$2:$H${dataRowCount + 1}, $L$2:$L${dataRowCount + 1}, ${m}, $C$2:$C${dataRowCount + 1}, "NHẬP")`,
                    `=SUMIFS($H$2:$H${dataRowCount + 1}, $L$2:$L${dataRowCount + 1}, ${m}, $C$2:$C${dataRowCount + 1}, "BÁN")`,
                    `=SUMIFS($I$2:$I${dataRowCount + 1}, $L$2:$L${dataRowCount + 1}, ${m})`
                ]);
            }
            monthlyRows.push([
                'Cả năm',
                `=SUM(B${monthlyStartRow + 2}:B${monthlyStartRow + 13})`,
                `=SUM(C${monthlyStartRow + 2}:C${monthlyStartRow + 13})`,
                `=SUM(D${monthlyStartRow + 2}:D${monthlyStartRow + 13})`
            ]);

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A${monthlyStartRow}:D${monthlyStartRow + 1}`,
                valueInputOption: 'RAW',
                requestBody: { values: monthlyHeader }
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A${monthlyStartRow + 2}:D${monthlyStartRow + 14}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: monthlyRows }
            });
        }

        return { success: true };

    } catch (error: any) {
        console.error('Write summary tables error:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to get sheet ID by name
async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string): Promise<number> {
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets(properties(sheetId,title))'
    });

    const sheet = response.data.sheets.find((s: any) => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

    return sheet.properties.sheetId;
}

// Setup "Tổng hợp" sheet with pre-calculated summary data
export async function setupSummarySheet(monthlyData?: { month: number; nhap: number; ban: number; lai: number }[]) {
    try {
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const base64Key = process.env.GOOGLE_PRIVATE_KEY_BASE64;
        const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (!clientEmail) throw new Error('Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL');

        let privateKey = '';
        if (base64Key) {
            privateKey = atob(base64Key);
        } else if (rawPrivateKey) {
            privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
        }

        if (!privateKey) throw new Error('Không tìm thấy Private Key');
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const sheetName = 'Tổng hợp';

        // 1. CREATE SHEET IF NOT EXISTS
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                gridProperties: {
                                    rowCount: 500,
                                    columnCount: 15,
                                }
                            }
                        }
                    }]
                }
            });
        } catch (e: any) {
            console.log('Sheet already exists or error:', e.message);
        }

        // Clear existing content first
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `'${sheetName}'!A1:O500`
        });

        // 2. ADD MONTHLY SUMMARY TABLE with pre-calculated values
        const currentYear = new Date().getFullYear();
        const summaryHeaders = [
            ['📊 TỔNG HỢP NĂM ' + currentYear, '', '', ''],
            ['Tháng', 'Tổng nhập', 'Tổng bán', 'Lãi']
        ];

        // Use provided monthly data or default to zeros
        const summaryRows = [];
        let totalNhap = 0, totalBan = 0, totalLai = 0;

        for (let month = 1; month <= 12; month++) {
            const data = monthlyData?.find(d => d.month === month);
            const nhap = data?.nhap || 0;
            const ban = data?.ban || 0;
            const lai = data?.lai || 0;

            totalNhap += nhap;
            totalBan += ban;
            totalLai += lai;

            summaryRows.push([
                `Tháng ${month}`,
                nhap > 0 ? nhap : '',
                ban > 0 ? ban : '',
                lai > 0 ? lai : ''
            ]);
        }

        summaryRows.push([
            'TỔNG NĂM',
            totalNhap > 0 ? totalNhap : '',
            totalBan > 0 ? totalBan : '',
            totalLai > 0 ? totalLai : ''
        ]);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1:D2`,
            valueInputOption: 'RAW',
            requestBody: { values: summaryHeaders }
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A3:D15`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: summaryRows }
        });

        // 3. APPLY FORMATTING 
        const sheetId = await getSheetId(sheets, spreadsheetId!, sheetName);

        const formatRequests = [
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0,
                        endRowIndex: 2,
                        startColumnIndex: 0,
                        endColumnIndex: 4
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.09, green: 0.46, blue: 0.82 },
                            textFormat: {
                                foregroundColor: { red: 1, green: 1, blue: 1 },
                                bold: true
                            },
                            horizontalAlignment: 'CENTER'
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
                }
            }
        ];

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: formatRequests
            }
        });

        return {
            success: true,
            message: `Sheet "Tổng hợp" đã được cập nhật với dữ liệu tháng!`
        };

    } catch (error: any) {
        console.error('Setup summary sheet error:', error);
        return { success: false, error: error.message };
    }
}
