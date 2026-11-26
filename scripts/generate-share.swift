import AppKit
import CoreText
import Foundation

// Code-rendered brand card using the existing game scene and licensed local fonts.
struct ShareFacts: Decodable { let missions: Int; let weapons: Int; let operatives: Int }
guard CommandLine.arguments.count == 2, let json = CommandLine.arguments[1].data(using: .utf8) else { fatalError("Use npm run share:generate") }
let facts = try JSONDecoder().decode(ShareFacts.self, from: json)
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
for file in ["RussoOne-Regular.ttf", "ChakraPetch-Regular.ttf"] {
    let url = root.appendingPathComponent("public/iron-front/fonts/" + file)
    CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
}
guard let display = NSFont(name: "RussoOne-Regular", size: 86),
      let body = NSFont(name: "ChakraPetch-Regular", size: 29),
      let small = NSFont(name: "ChakraPetch-Regular", size: 23),
      let background = NSImage(contentsOf: root.appendingPathComponent("public/iron-front/scenery/harbor-night-v1.png")),
      let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1200, pixelsHigh: 630, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
      let context = NSGraphicsContext(bitmapImageRep: rep)
else { fatalError("Missing game image, brand font or drawing context") }
let gold = NSColor(calibratedRed: 0.94, green: 0.74, blue: 0.45, alpha: 1)
let white = NSColor(calibratedRed: 0.93, green: 0.95, blue: 0.91, alpha: 1)
let muted = NSColor(calibratedRed: 0.73, green: 0.81, blue: 0.83, alpha: 1)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = context
let frame = NSRect(x: 0, y: 0, width: 1200, height: 630)
background.draw(in: frame, from: NSRect(x: 0, y: 80, width: background.size.width, height: background.size.height * 0.79), operation: .copy, fraction: 1)
NSGradient(starting: NSColor(calibratedRed: 0.025, green: 0.065, blue: 0.10, alpha: 0.97), ending: NSColor(calibratedRed: 0.025, green: 0.065, blue: 0.10, alpha: 0.30))!.draw(in: frame, angle: 0)
NSColor(calibratedRed: 0.025, green: 0.065, blue: 0.10, alpha: 0.72).setFill()
NSRect(x: 0, y: 0, width: 1200, height: 105).fill()
gold.setFill()
NSRect(x: 0, y: 624, width: 1200, height: 6).fill()
// Compact RO shield, matching the site's code-native emblem.
let shield = NSBezierPath()
shield.move(to: NSPoint(x: 66,y: 558)); shield.line(to: NSPoint(x: 118,y: 558)); shield.line(to: NSPoint(x: 118,y: 511)); shield.line(to: NSPoint(x: 92,y: 496)); shield.line(to: NSPoint(x: 66,y: 511)); shield.close(); shield.fill()
("RO" as NSString).draw(at: NSPoint(x: 74,y: 518), withAttributes: [.font: NSFont(name: "RussoOne-Regular", size: 22)!, .foregroundColor: NSColor(calibratedRed: 0.05,green: 0.12,blue: 0.17,alpha: 1)])
("RAID OPS" as NSString).draw(at: NSPoint(x: 62,y: 331), withAttributes: [.font: display, .foregroundColor: white])
("Run and gun. In your browser." as NSString).draw(at: NSPoint(x: 67,y: 274), withAttributes: [.font: body, .foregroundColor: gold])
("Single-player action · Keyboard controls" as NSString).draw(at: NSPoint(x: 67,y: 217), withAttributes: [.font: small, .foregroundColor: muted])
("\(facts.missions) missions   /   \(facts.weapons) weapons   /   \(facts.operatives) operatives" as NSString).draw(at: NSPoint(x: 67,y: 139), withAttributes: [.font: small, .foregroundColor: white])
("runandgun.games" as NSString).draw(at: NSPoint(x: 67,y: 43), withAttributes: [.font: small, .foregroundColor: muted])
NSGraphicsContext.restoreGraphicsState()
guard let data = rep.representation(using: .png, properties: [:]) else { fatalError("PNG encoding failed") }
let target = root.appendingPathComponent("public/images/raid-ops-share.png")
try data.write(to: target)
print("Created \(target.path): 1200 x 630, \(data.count) bytes")
