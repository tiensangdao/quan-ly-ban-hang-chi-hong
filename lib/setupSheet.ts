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

        // 3. ADD FORMULAS TO DATA COLUMNS
        // Column H (Thành tiền) = Số lượng * Đơn giá
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!H2`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['=IF(F2="","",F2*G2)']]
            }
        });

        // Column L (Tháng) = MONTH(Ngày)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!L2`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['=IF(B2="","",MONTH(B2))']]
            }
        });
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

// Setup "Tổng hợp" sheet with summary tables aggregating all years
export async function setupSummarySheet() {
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

        // 2. ADD MONTHLY SUMMARY TABLE (Rows 1-16)
        const currentYear = new Date().getFullYear();
        const summaryHeaders = [
            ['📊 TỔNG HỢP NĂM ' + currentYear, '', '', ''],
            ['Tháng', 'Tổng nhập', 'Tổng bán', 'Lãi']
        ];

        const summaryRows = [];
        for (let month = 1; month <= 12; month++) {
            summaryRows.push([
                `Tháng ${month}`,
                `=SUMIFS('${currentYear}'!$H:$H,'${currentYear}'!$C:$C,"NHẬP",'${currentYear}'!$L:$L,${month})`,
                `=SUMIFS('${currentYear}'!$H:$H,'${currentYear}'!$C:$C,"BÁN",'${currentYear}'!$L:$L,${month})`,
                `=SUMIFS('${currentYear}'!$I:$I,'${currentYear}'!$L:$L,${month})`
            ]);
        }
        summaryRows.push([
            'TỔNG NĂM',
            `=SUM(B3:B14)`,
            `=SUM(C3:C14)`,
            `=SUM(D3:D14)`
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
            message: `Sheet "Tổng hợp" đã được setup với bảng summary!`
        };

    } catch (error: any) {
        console.error('Setup summary sheet error:', error);
        return { success: false, error: error.message };
    }
}
