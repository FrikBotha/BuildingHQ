export const EXTRACTION_PROMPT = `You are analyzing a South African building/construction quotation document.
Extract all cost information and return it as a JSON object.

Return ONLY a valid JSON object with this exact structure (no other text, no markdown fences):

{
  "supplierName": "string or null",
  "supplierContact": "string or null - contact person name",
  "supplierEmail": "string or null",
  "supplierPhone": "string or null",
  "quotationNumber": "string or null - the quote/reference number",
  "quotationDate": "YYYY-MM-DD or null",
  "validUntil": "YYYY-MM-DD or null - quote validity/expiry date",
  "tradeCategory": "one of the allowed values below, or null",
  "lineItems": [
    {
      "description": "string - description of the work/material",
      "unit": "string - unit of measurement (m2, m3, m, no, kg, item, day, sum, l, allow)",
      "quantity": 0,
      "unitRate": 0,
      "amount": 0
    }
  ],
  "subtotal": 0,
  "vatAmount": 0,
  "totalInclVat": 0,
  "notes": "string or null - any terms, conditions, or additional notes",
  "confidence": "high or medium or low",
  "warnings": ["array of strings describing any issues"]
}

Allowed tradeCategory values:
general_builder, plumber, electrician, roofing, tiling, painting, carpentry, glazing, waterproofing, plastering, landscaping, structural_steel, hvac, security, other

Important rules:
- All monetary values must be numeric (no currency symbols) and in South African Rand (ZAR)
- South African VAT is 15%
- For each line item: amount should equal quantity × unitRate
- If the document only shows a total without line items, create a single line item with description "Total as per quotation" and the total as the amount
- If quantity or unitRate is not clear, set quantity=1 and unitRate=amount
- subtotal is the sum of all line item amounts (excluding VAT)
- If only a VAT-inclusive total is shown, back-calculate: subtotal = totalInclVat / 1.15, vatAmount = totalInclVat - subtotal
- Set confidence to "high" if all data is clearly readable, "medium" if some fields are uncertain, "low" if the document is unclear or partially readable
- Add warnings for anything that could not be determined or seems uncertain
- Parse dates in any format and convert to YYYY-MM-DD
- Look for supplier details in letterhead, header, or footer areas
- Common SA units: m² (square meters), m³ (cubic meters), m (linear meters), no (number/each), kg, item, day, sum (lump sum), l (litres), allow (allowance)`;
