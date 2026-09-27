import { describe, expect, it } from "vitest";
import { feedItem, labelFromDescription, parseFeed } from "../lib/catalog/awin-feed";
import { zooplusLink } from "../lib/zooplus";

// A few rows in the layout of an Awin "Create-a-Feed" export (standard Awin column names).
const HEADER = "aw_deep_link,product_name,aw_product_id,merchant_image_url,description,merchant_category,search_price,merchant_deep_link,brand_name,ean,merchant_product_category_path";
const ROWS = [
  `"https://www.awin1.com/pclick.php?p=1&a=3106869&m=8139","Kitekat Kip in saus 12x100g","1","https://media.zooplus.com/1.jpg","<p>Heerlijk.</p><p><b>Samenstelling:</b> Vlees en dierlijke bijproducten (waarvan 4% kip), granen, mineralen.</p><p><b>Analytische bestanddelen:</b> Ruw eiwit 7,5%, ruw vet 4,5%, ruwe as 2%, ruwe celstof 0,3%, vocht 82%.</p><p><b>Voedingsadvies:</b> 4 zakjes per dag.</p>","Natvoer","7,99","https://www.zooplus.nl/shop/katten/kattenvoer_blik/kitekat/123","Kitekat","5998749100001","Kat > Kattenvoer > Natvoer"`,
  `"https://www.awin1.com/pclick.php?p=2&a=3106869&m=8139","Kong Classic speeltje","2","https://media.zooplus.com/2.jpg","Speelgoed","Speelgoed","9,99","https://www.zooplus.nl/shop/honden/speelgoed/2","Kong","0035585111117","Hond > Speelgoed"`,
  `"https://www.awin1.com/pclick.php?p=3&a=3106869&m=8139","Josera Kids hondenvoer 15 kg","3","https://media.zooplus.com/3.jpg","Voor pups.","Droogvoer","54,99","https://www.zooplus.nl/shop/honden/hondenvoer_droog/josera/3","Josera","4032254211846","Hond > Hondenvoer > Droogvoer"`,
];

describe("zooplus product file (Awin)", () => {
  const rows = parseFeed([HEADER, ...ROWS].join("\n"));

  it("reads comma and pipe separated files", () => {
    expect(rows).toHaveLength(3);
    const piped = parseFeed("product_name|ean|merchant_category\nFelix Natvoer|1234567890128|Kat > Kattenvoer");
    expect(piped[0].ean).toBe("1234567890128");
  });

  it("keeps dog and cat food, drops everything else", () => {
    const items = rows.map(feedItem);
    expect(items[0]?.species).toBe("Kat");
    expect(items[1]).toBeNull();
    expect(items[2]?.species).toBe("Hond");
  });

  it("takes the ingredient list and analysis out of the description", () => {
    const item = feedItem(rows[0])!;
    expect(item.ingredients).toBe("Vlees en dierlijke bijproducten (waarvan 4% kip), granen, mineralen");
    expect(item.analysis).toBe("Ruw eiwit 7,5%, ruw vet 4,5%, ruwe as 2%, ruwe celstof 0,3%, vocht 82%");
    expect(item.price).toBe(7.99);
    expect(item.url).toBe("https://www.zooplus.nl/shop/katten/kattenvoer_blik/kitekat/123");
    expect(feedItem(rows[2])!.ingredients).toBe("");
  });

  it("finds label sections in plain text too", () => {
    const r = labelFromDescription("Samenstelling: kip (30%), rijst. Analytische bestanddelen: eiwit 26%, vet 15%. Toevoegingsmiddelen: vitamine A.");
    expect(r.ingredients).toBe("kip (30%), rijst");
    expect(r.analysis).toBe("eiwit 26%, vet 15%");
  });
});

describe("zooplus buy button", () => {
  it("uses the exact product page from the product file, through the Awin tracker", () => {
    const link = zooplusLink({ brand: "Kitekat", name: "Kitekat Kip", zooplusUrl: "https://www.zooplus.nl/shop/katten/kattenvoer_blik/kitekat/123" }, "scanabowl-nl-x");
    expect(link.exact).toBe(true);
    const url = new URL(link.url);
    expect(url.hostname).toBe("www.awin1.com");
    expect(url.searchParams.get("ued")).toBe("https://www.zooplus.nl/shop/katten/kattenvoer_blik/kitekat/123");
  });

  it("falls back to a search, and never links to another site", () => {
    expect(zooplusLink({ brand: "Kitekat", name: "Kitekat Kip" }, "x").exact).toBe(false);
    expect(zooplusLink({ brand: "Kitekat", name: "Kitekat Kip", zooplusUrl: "https://evil.example/zooplus.nl" }, "x").exact).toBe(false);
    expect(zooplusLink({ brand: "Kitekat", name: "Kitekat Kip", zooplusUrl: "http://www.zooplus.nl/shop/1" }, "x").exact).toBe(false);
  });
});

describe("zooplus product file in Google Shopping layout", () => {
  it("is read too", () => {
    const rows = parseFeed(
      [
        "id,title,description,link,image_link,price,brand,gtin,product_type",
        `"123","Almo Nature HFC Tonijn 70 g","Samenstelling: tonijn 55%, visbouillon 44%, rijst 1%. Analytische bestanddelen: ruw eiwit 16%, ruw vet 0,5%, ruwe as 2%, ruwe celstof 0,1%, vocht 82%.","https://www.zooplus.nl/shop/katten/kattenvoer_blik/almo/123","https://media.zooplus.com/123.jpg","2.49 EUR","Almo Nature","8001154121015","Kat > Kattenvoer > Natvoer"`,
      ].join("\n"),
    );
    const item = feedItem(rows[0])!;
    expect(item.species).toBe("Kat");
    expect(item.price).toBe(2.49);
    expect(item.url).toBe("https://www.zooplus.nl/shop/katten/kattenvoer_blik/almo/123");
    expect(item.ingredients).toBe("tonijn 55%, visbouillon 44%, rijst 1%");
  });

  it("recognises Awin's list of feeds, which is not a product file", async () => {
    const { isFeedList } = await import("../lib/catalog/awin-feed");
    const list = parseFeed('Advertiser ID,Advertiser Name,Membership Status,Feed ID,URL\n"1","Some Shop","Not Joined","F1","https://example.invalid/feed.csv.gz"');
    expect(isFeedList(list)).toBe(true);
    expect(isFeedList(parseFeed("title,gtin\nx,1234567890128"))).toBe(false);
  });
});
