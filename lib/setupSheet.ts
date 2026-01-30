'use server';
import { google } from 'googleapis';

// Setup complete sheet structure with formulas and formatting
export async function setupYearSheet(year: number) {
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

        // 3. ADD MONTHLY SUMMARY TABLE (Starting at column O, row 1)
        const monthlySummaryHeaders = [
            ['📊 TỔNG HỢP NĂM ' + year, '', '', ''],
            ['Tháng', 'Tổng nhập', 'Tổng bán', 'Lãi']
        ];

        const monthlyRows = [];
        for (let month = 1; month <= 12; month++) {
            monthlyRows.push([
                `Tháng ${month}`,
                `=SUMIFS($H:$H,$C:$C,"NHẬP",$L:$L,${month})`, // Tổng nhập
                `=SUMIFS($H:$H,$C:$C,"BÁN",$L:$L,${month})`,   // Tổng bán
                `=SUMIFS($I:$I,$L:$L,${month})`                 // Lãi
            ]);
        }
        monthlyRows.push([
            'TỔNG NĂM',
            `=SUM(P3:P14)`,
            `=SUM(Q3:Q14)`,
            `=SUM(R3:R14)`
        ]);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!O1:R2`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: monthlySummaryHeaders
            }
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!O3:R15`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: monthlyRows
            }
        });

        // 4. ADD TOP PRODUCTS TABLE (Starting at column O, row 18)
        const topProductsHeaders = [
            ['🏆 TOP SẢN PHẨM BÁN CHẠY NĂM ' + year, '', '', ''],
            ['#', 'Sản phẩm', 'Số lượng', 'Doanh thu', 'Lãi']
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!O18:S19`,
            valueInputOption: 'RAW',
            requestBody: {
                values: topProductsHeaders
            }
        });

        // Note: Top products will use QUERY formula (added after we have data)

        // 5. ADD INVENTORY TABLE (Starting at column O, row 30)
        const inventoryHeaders = [
            ['📦 TỒN KHO HIỆN TẠI', '', '', '', ''],
            ['Sản phẩm', 'Tổng nhập', 'Tổng bán', 'Tồn kho', 'Ghi chú']
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!O30:S31`,
            valueInputOption: 'RAW',
            requestBody: {
                values: inventoryHeaders
            }
        });

        // Note: Inventory rows will be added via formulas based on unique products

        // 6. APPLY FORMATTING
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
            // Bold headers for summary tables
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 14, // Column O
                        endColumnIndex: 18
                    },
                    cell: {
                        userEnteredFormat: {
                            textFormat: {
                                bold: true,
                                fontSize: 12
                            },
                            horizontalAlignment: 'CENTER'
                        }
                    },
                    fields: 'userEnteredFormat(textFormat,horizontalAlignment)'
                }
            }
        ];

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: formatRequests
            }
        });

        // 7. ADD FORMULA TO "Tháng" COLUMN (L2:L)
        // This will be added as a formula template
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!L2`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['=IF(B2="","",MONTH(B2))']]
            }
        });

        return {
            success: true,
            message: `Sheet "${sheetName}" đã được setup với đầy đủ bảng tổng hợp, công thức và màu sắc!`
        };

    } catch (error: any) {
        console.error('Setup sheet error:', error);
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
