import { NextResponse } from "next/server";
import { generateSalariesExcel } from "@/lib/salaries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    if (!month) {
      return NextResponse.json({ error: "Month parameter is required (YYYY-MM)" }, { status: 400 });
    }

    // Determine base URL for internal fetch
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const excelBuffer = await generateSalariesExcel(month, baseUrl);

    // Return as a downloadable file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="salaries-${month}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export salaries error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
