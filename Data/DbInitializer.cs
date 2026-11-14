using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Data
{
    public static class DbInitializer
    {
        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "KARAJAK_SALT_2026"));
            return Convert.ToBase64String(bytes);
        }

        public static void Initialize(KarajakDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Users.Any())
            {
                return; // Database already seeded
            }

            // 1. Create Users
            var admin = new User
            {
                FullName = "KARAJAK System Administrator",
                Email = "admin@karajak.ai",
                PasswordHash = HashPassword("Admin123!"),
                PhoneNumber = "+962 79 000 0001",
                Role = "Admin",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow.AddMonths(-6)
            };

            var sellerOmar = new User
            {
                FullName = "Omar Khan",
                Email = "omar@gmail.com",
                PasswordHash = HashPassword("Seller123!"),
                PhoneNumber = "+962 79 123 4567",
                Role = "Seller",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                VerificationDocument = "DOC-DEALER-OMAR-2024.pdf",
                CreatedAt = DateTime.UtcNow.AddMonths(-5)
            };

            var sellerLuxury = new User
            {
                FullName = "Luxury Autos Ltd.",
                Email = "luxury@autos.com",
                PasswordHash = HashPassword("Seller123!"),
                PhoneNumber = "+962 78 555 1212",
                Role = "Seller",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
                VerificationDocument = "COMMERCIAL_REGISTRY_774.pdf",
                CreatedAt = DateTime.UtcNow.AddMonths(-4)
            };

            var sellerMarcus = new User
            {
                FullName = "Marcus Sterling",
                Email = "marcus@sterling.com",
                PasswordHash = HashPassword("Seller123!"),
                PhoneNumber = "+962 77 987 6543",
                Role = "Seller",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow.AddMonths(-3)
            };

            var sellerSarah = new User
            {
                FullName = "Sarah Miller",
                Email = "sarah@autodealer.io",
                PasswordHash = HashPassword("Seller123!"),
                PhoneNumber = "+962 79 444 3322",
                Role = "Seller",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow.AddMonths(-2)
            };

            var buyerAli = new User
            {
                FullName = "Ali Hassan",
                Email = "ali@gmail.com",
                PasswordHash = HashPassword("Buyer123!"),
                PhoneNumber = "+962 79 876 5432",
                Role = "Buyer",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow.AddMonths(-4)
            };

            var buyerAlex = new User
            {
                FullName = "Alex Rivera",
                Email = "alex.r@velocitymail.com",
                PasswordHash = HashPassword("Buyer123!"),
                PhoneNumber = "+962 78 888 9999",
                Role = "Buyer",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow.AddMonths(-3)
            };

            var buyerElena = new User
            {
                FullName = "Elena Zhang",
                Email = "elena.z@global.com",
                PasswordHash = HashPassword("Buyer123!"),
                PhoneNumber = "+962 79 111 2233",
                Role = "Buyer",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow.AddMonths(-2)
            };

            context.Users.AddRange(admin, sellerOmar, sellerLuxury, sellerMarcus, sellerSarah, buyerAli, buyerAlex, buyerElena);
            context.SaveChanges();

            // 2. Create Cars (Vehicle Listings matching Chapter 5 figures)
            var cars = new List<Car>
            {
                new Car
                {
                    SellerId = sellerMarcus.Id,
                    Brand = "Porsche",
                    Model = "911 GT3",
                    Year = 2023,
                    Price = 195000,
                    Mileage = 3450,
                    FuelType = "Petrol",
                    Transmission = "Automatic",
                    Color = "White",
                    Location = "Amman, Jordan",
                    Description = "2023 Porsche 911 GT3 in pristine showroom condition. Naturally aspirated 4.0L flat-6 engine, 502 HP, PDK transmission, Front Axle Lift system, Carbon Bucket seats, Ceramic Composite Brakes (PCCB). Clean title, single owner.",
                    Status = "Available",
                    DriveTrain = "RWD",
                    EngineSize = "4.0L Flat-6",
                    FuelConsumption = "15 mpg city / 18 hwy",
                    KeyFeatures = "Ceramic Brakes, Carbon Buckets, Front Lift, Sport Chrono, Apple CarPlay, Track Telemetry",
                    CreatedAt = DateTime.UtcNow.AddDays(-12),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1000&q=80", IsPrimary = true },
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80" },
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80" }
                    }
                },
                new Car
                {
                    SellerId = sellerLuxury.Id,
                    Brand = "BMW",
                    Model = "M4 Competition",
                    Year = 2024,
                    Price = 82500,
                    Mileage = 12500,
                    FuelType = "Petrol",
                    Transmission = "Automatic",
                    Color = "Isle of Man Green",
                    Location = "Amman, Jordan",
                    Description = "2024 BMW M4 Competition M xDrive. 503 hp TwinPower Turbo inline-6, Executive Package, Harman Kardon Sound, Carbon fiber roof, Adaptive M Suspension.",
                    Status = "Available",
                    DriveTrain = "AWD",
                    EngineSize = "3.0L Twin-Turbo I6",
                    FuelConsumption = "16 city / 23 hwy",
                    KeyFeatures = "M xDrive AWD, Carbon Roof, Head-Up Display, Harman Kardon, Laserlights, Heated Seats",
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80", IsPrimary = true },
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80" }
                    }
                },
                new Car
                {
                    SellerId = sellerOmar.Id,
                    Brand = "Tesla",
                    Model = "Model S Plaid",
                    Year = 2024,
                    Price = 89990,
                    Mileage = 1200,
                    FuelType = "Electric",
                    Transmission = "Automatic",
                    Color = "Midnight Silver",
                    Location = "Amman, Jordan",
                    Description = "Tri-Motor All-Wheel Drive Model S Plaid. 1,020 HP, 0-60 in 1.99s, Yoke steering, Full Self-Driving Capability included, 396 miles EPA estimated range.",
                    Status = "Available",
                    DriveTrain = "AWD",
                    BatteryCapacity = "100 kWh",
                    ChargingType = "Supercharger 250kW",
                    RangePerCharge = 396,
                    KeyFeatures = "Tri-Motor AWD, Full Self-Driving, 21 Arachnid Wheels, Carbon Spoiler, 17 Touchscreen, Premium Audio",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80", IsPrimary = true },
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1000&q=80" }
                    }
                },
                new Car
                {
                    SellerId = sellerSarah.Id,
                    Brand = "Mercedes-Benz",
                    Model = "C-Class C300",
                    Year = 2022,
                    Price = 38995,
                    Mileage = 24500,
                    FuelType = "Gasoline",
                    Transmission = "Automatic",
                    Color = "Obsidian Black",
                    Location = "Amman, Jordan",
                    Description = "2022 Mercedes-Benz C300 4MATIC Sedan. Panoramic Sunroof, Burmester 3D Sound System, AMG Line exterior styling, 11.9-inch central touchscreen.",
                    Status = "Available",
                    DriveTrain = "AWD",
                    EngineSize = "2.0L Turbo I4",
                    FuelConsumption = "24 city / 33 hwy",
                    KeyFeatures = "AMG Line, Burmester 3D, Panoramic Sunroof, Ambient Lighting 64-color, Active Brake Assist",
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80", IsPrimary = true },
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1000&q=80" }
                    }
                },
                new Car
                {
                    SellerId = sellerOmar.Id,
                    Brand = "Audi",
                    Model = "A4 Premium",
                    Year = 2021,
                    Price = 34450,
                    Mileage = 31200,
                    FuelType = "Hybrid",
                    Transmission = "Automatic",
                    Color = "Chronos Gray",
                    Location = "Amman, Jordan",
                    Description = "Audi A4 45 TFSI Quattro S Line. Mild-hybrid system, Virtual Cockpit, Leather seating, Bang & Olufsen 3D Sound, clean CarFax report.",
                    Status = "Available",
                    DriveTrain = "AWD",
                    EngineSize = "2.0L Turbo 4-Cyl",
                    FuelConsumption = "27 city / 35 hwy",
                    KeyFeatures = "Quattro AWD, Virtual Cockpit, S Line styling, Bang & Olufsen Audio, Wireless CarPlay",
                    CreatedAt = DateTime.UtcNow.AddDays(-18),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80", IsPrimary = true },
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80" }
                    }
                },
                new Car
                {
                    SellerId = sellerMarcus.Id,
                    Brand = "BMW",
                    Model = "i4 eDrive40",
                    Year = 2022,
                    Price = 48900,
                    Mileage = 8000,
                    FuelType = "Electric",
                    Transmission = "Automatic",
                    Color = "Portimao Blue",
                    Location = "Amman, Jordan",
                    Description = "All-electric 4-door Gran Coupe. 335 HP, 83.9 kWh battery with over 300 miles range. BMW Curved Display with iDrive 8.",
                    Status = "Available",
                    DriveTrain = "RWD",
                    BatteryCapacity = "83.9 kWh",
                    ChargingType = "DC Fast 200kW",
                    RangePerCharge = 301,
                    KeyFeatures = "Curved Display, Head-Up Display, Parking Assistant Plus, Harman Kardon, Wireless Charger",
                    CreatedAt = DateTime.UtcNow.AddDays(-8),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                },
                new Car
                {
                    SellerId = sellerSarah.Id,
                    Brand = "Audi",
                    Model = "Q5 Hybrid",
                    Year = 2024,
                    Price = 55200,
                    Mileage = 2000,
                    FuelType = "Hybrid",
                    Transmission = "Automatic",
                    Color = "Mythos Black",
                    Location = "Amman, Jordan",
                    Description = "Audi Q5 55 TFSI e Quattro Plug-in Hybrid. 362 total horsepower, electric only mode for daily city commutes, Matrix LED headlights.",
                    Status = "Available",
                    DriveTrain = "AWD",
                    EngineSize = "2.0L Turbo PHEV",
                    FuelConsumption = "61 MPGe combined",
                    KeyFeatures = "Plug-in Hybrid, Matrix LED, Panoramic Roof, Adaptive Cruise Control, Leather Seats",
                    CreatedAt = DateTime.UtcNow.AddDays(-6),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1541348263662-e0c82661ba75?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                },
                new Car
                {
                    SellerId = sellerOmar.Id,
                    Brand = "Toyota",
                    Model = "Camry XSE V6",
                    Year = 2022,
                    Price = 32450,
                    Mileage = 12450,
                    FuelType = "Petrol",
                    Transmission = "Automatic",
                    Color = "Celestial Silver",
                    Location = "Amman, Jordan",
                    Description = "Top-tier Camry XSE with legendary 3.5L V6 engine (301 HP). Cockpit Red leather interior, Panoramic Glass Roof, JBL Audio, Toyota Safety Sense 2.5+.",
                    Status = "Available",
                    DriveTrain = "FWD",
                    EngineSize = "3.5L V6 DOHC",
                    FuelConsumption = "22 City / 33 Hwy",
                    KeyFeatures = "Panoramic Roof, JBL Audio, Red Leather Seats, Blind Spot Monitor, Adaptive Cruise",
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                },
                new Car
                {
                    SellerId = sellerMarcus.Id,
                    Brand = "Lucid",
                    Model = "Air Pure",
                    Year = 2023,
                    Price = 74900,
                    Mileage = 8400,
                    FuelType = "Electric",
                    Transmission = "Automatic",
                    Color = "Stellar White",
                    Location = "Amman, Jordan",
                    Description = "2023 Lucid Air Pure AWD. 480 horsepower, 410-mile range on single charge. Glass Canopy roof, 34-inch 5K curved cockpit display, ultra-luxurious Mojave interior.",
                    Status = "Available",
                    DriveTrain = "AWD",
                    BatteryCapacity = "92 kWh",
                    ChargingType = "Ultra-Fast 900V DC",
                    RangePerCharge = 410,
                    KeyFeatures = "Glass Canopy, 34 5K Display, DreamDrive ADAS, Surreal Sound Pro, Massage Seats",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                },
                new Car
                {
                    SellerId = sellerLuxury.Id,
                    Brand = "Audi",
                    Model = "RS7 Sportback",
                    Year = 2022,
                    Price = 118900,
                    Mileage = 5700,
                    FuelType = "Petrol",
                    Transmission = "Automatic",
                    Color = "Nardo Gray",
                    Location = "Amman, Jordan",
                    Description = "2022 Audi RS7 Sportback in iconic Nardo Gray. 591 HP twin-turbo V8, RS Sport Exhaust, Dynamic Package Plus with 190 mph top speed, Ceramic brakes.",
                    Status = "Reserved",
                    DriveTrain = "AWD",
                    EngineSize = "4.0L Twin-Turbo V8",
                    FuelConsumption = "15 city / 22 hwy",
                    KeyFeatures = "RS Exhaust, Ceramic Brakes, Carbon Trim, Nappa Leather, Bang & Olufsen 3D Advanced",
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                },
                new Car
                {
                    SellerId = sellerLuxury.Id,
                    Brand = "Ferrari",
                    Model = "Roma",
                    Year = 2022,
                    Price = 215000,
                    Mileage = 3100,
                    FuelType = "Petrol",
                    Transmission = "Automatic",
                    Color = "Rosso Corsa",
                    Location = "Amman, Jordan",
                    Description = "Stunning 2022 Ferrari Roma Coupe. 3.9L Twin-Turbo V8 pushing 612 HP, 8-speed F1 dual-clutch transmission. Factory warranty & 7-year genuine maintenance.",
                    Status = "Available",
                    DriveTrain = "RWD",
                    EngineSize = "3.9L Twin-Turbo V8",
                    FuelConsumption = "17 city / 22 hwy",
                    KeyFeatures = "Carbon Steering Wheel with LEDs, Scuderia Shields, Passenger Display, Magneride Suspension",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                },
                new Car
                {
                    SellerId = sellerSarah.Id,
                    Brand = "Chevrolet",
                    Model = "Corvette Stingray",
                    Year = 2021,
                    Price = 64500,
                    Mileage = 14200,
                    FuelType = "Petrol",
                    Transmission = "Automatic",
                    Color = "Torch Red",
                    Location = "Amman, Jordan",
                    Description = "Mid-engine 6.2L LT2 V8 with 495 HP and Z51 Performance Package. Magnetic Ride Control, Performance Data Recorder, GT2 bucket seats.",
                    Status = "Pending", // Pending admin review as in Figure 5.35!
                    DriveTrain = "RWD",
                    EngineSize = "6.2L V8",
                    FuelConsumption = "15 city / 27 hwy",
                    KeyFeatures = "Z51 Package, Magnetic Ride, Performance Data Recorder, Front Lift, Bose 14-Speaker",
                    CreatedAt = DateTime.UtcNow.AddHours(-4),
                    Images = new List<CarImage>
                    {
                        new CarImage { ImageUrl = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80", IsPrimary = true }
                    }
                }
            };

            context.Cars.AddRange(cars);
            context.SaveChanges();

            // 3. Create Sample Bookings & Payments
            var car1 = cars[0]; // Porsche 911 GT3
            var car2 = cars[1]; // BMW M4 Competition
            var car3 = cars[2]; // Tesla Model S Plaid

            var booking1 = new Booking
            {
                BuyerId = buyerAli.Id,
                CarId = car2.Id,
                BookingDate = DateTime.UtcNow.AddDays(-14),
                ScheduledHandoverDate = DateTime.UtcNow.AddDays(-10),
                ScheduledTimeSlot = "01:30 PM",
                BookingStatus = "Completed",
                OfferAmount = 82500,
                DeliveryLocation = "KARAJAK Delivery Center - Amman",
                Notes = "Vehicle inspected and handed over successfully."
            };

            var payment1 = new Payment
            {
                Booking = booking1,
                Amount = 82500,
                PaymentMethod = "Credit Card",
                PaymentStatus = "Successful",
                TransactionCode = "TXN-987654321",
                TransactionDate = DateTime.UtcNow.AddDays(-10),
                ReceiptUrl = "/receipts/RCP-82500.pdf"
            };

            var booking2 = new Booking
            {
                BuyerId = buyerAli.Id,
                CarId = car1.Id,
                BookingDate = DateTime.UtcNow.AddDays(-4),
                ScheduledHandoverDate = DateTime.UtcNow.AddDays(2),
                ScheduledTimeSlot = "09:00 AM",
                BookingStatus = "Payment Pending",
                OfferAmount = 195000,
                DeliveryLocation = "KARAJAK VIP Concierge - Amman",
                Notes = "Deposit confirmed, awaiting full payment release."
            };

            var booking3 = new Booking
            {
                BuyerId = buyerAlex.Id,
                CarId = car3.Id,
                BookingDate = DateTime.UtcNow.AddDays(-1),
                ScheduledHandoverDate = DateTime.UtcNow.AddDays(4),
                ScheduledTimeSlot = "04:00 PM",
                BookingStatus = "Pending",
                OfferAmount = 89990,
                DeliveryLocation = "KARAJAK Delivery Center - Amman",
                Notes = "Looking for test drive before finalizing transfer."
            };

            context.Bookings.AddRange(booking1, booking2, booking3);
            context.Payments.Add(payment1);
            context.SaveChanges();

            // 4. Create Reviews
            var review1 = new Review
            {
                BuyerId = buyerAli.Id,
                SellerId = sellerMarcus.Id,
                CarId = car1.Id,
                Rating = 5,
                Comment = "Excellent car, verified condition and very smooth transaction with Marcus!",
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            };

            var review2 = new Review
            {
                BuyerId = buyerAlex.Id,
                SellerId = sellerLuxury.Id,
                CarId = car2.Id,
                Rating = 5,
                Comment = "Top-notch dealership experience. Everything was exactly as described.",
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            };

            context.Reviews.AddRange(review1, review2);

            // 5. Create Chat Messages
            var chat1 = new ChatMessage
            {
                SenderId = buyerAli.Id,
                ReceiverId = sellerMarcus.Id,
                CarId = car1.Id,
                Content = "Hello! Is the 2023 Porsche 911 GT3 still available? I'm very interested in seeing it tomorrow if possible.",
                SentAt = DateTime.UtcNow.AddHours(-6),
                IsRead = true
            };

            var chat2 = new ChatMessage
            {
                SenderId = sellerMarcus.Id,
                ReceiverId = buyerAli.Id,
                CarId = car1.Id,
                Content = "Hello Ali! Yes, it is currently in our downtown showroom. I can schedule a private viewing for you tomorrow afternoon at 2 PM. Does that work?",
                SentAt = DateTime.UtcNow.AddHours(-5),
                IsRead = true
            };

            var chat3 = new ChatMessage
            {
                SenderId = buyerAli.Id,
                ReceiverId = sellerMarcus.Id,
                CarId = car1.Id,
                Content = "That sounds great. I'm very serious about purchasing this week. Would it be possible to see some close-up photos of the interior upholstery and the front lift switch?",
                SentAt = DateTime.UtcNow.AddHours(-4),
                IsRead = true
            };

            var chat4 = new ChatMessage
            {
                SenderId = sellerMarcus.Id,
                ReceiverId = buyerAli.Id,
                CarId = car1.Id,
                Content = "Absolutely! Just sent those to your WhatsApp and updated the gallery. The interior is pristine, always had floor mats and no smoking. Let me know if you need any other specific angles.",
                SentAt = DateTime.UtcNow.AddHours(-3),
                IsRead = false
            };

            context.ChatMessages.AddRange(chat1, chat2, chat3, chat4);

            // 6. Create Notifications
            var notif1 = new Notification
            {
                UserId = buyerAli.Id,
                Title = "Booking Confirmed",
                Content = "Your booking request for the 2024 BMW M4 Competition has been completed.",
                Type = "Booking",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var notif2 = new Notification
            {
                UserId = sellerMarcus.Id,
                Title = "New Buyer Inquiry",
                Content = "Ali Hassan sent an inquiry regarding 2023 Porsche 911 GT3.",
                Type = "Message",
                IsRead = true,
                CreatedAt = DateTime.UtcNow.AddHours(-6)
            };

            var notif3 = new Notification
            {
                UserId = admin.Id,
                Title = "New Listing Awaiting Approval",
                Content = "2021 Chevrolet Corvette Stingray submitted by Sarah Miller requires review.",
                Type = "Listing",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddHours(-4)
            };

            context.Notifications.AddRange(notif1, notif2, notif3);

            // 7. Create Moderation Reports
            var report1 = new Report
            {
                ReporterId = buyerAlex.Id,
                TargetType = "Listing",
                TargetId = car1.Id,
                TargetTitle = "Listing: 2023 Performance Sedan / Vintage Collector",
                Reason = "Misleading mileage description. User claims 5k miles, but photos show 45k on odometer.",
                Priority = "High Priority",
                Status = "Active",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            };

            var report2 = new Report
            {
                ReporterId = sellerSarah.Id,
                TargetType = "User",
                TargetId = buyerAlex.Id,
                TargetTitle = "User: John_Doe_Cars88",
                Reason = "Harassment in private messages. Using unprofessional language after price negotiation failed.",
                Priority = "Standard",
                Status = "Active",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var report3 = new Report
            {
                ReporterId = admin.Id,
                TargetType = "Listing",
                TargetId = car2.Id,
                TargetTitle = "Listing: Vintage Collector X-10",
                Reason = "Potential fraud. Images appear to be stolen from an auction site in another country. High risk of scam.",
                Priority = "Urgent",
                Status = "Active",
                CreatedAt = DateTime.UtcNow.AddMinutes(-45)
            };

            context.Reports.AddRange(report1, report2, report3);

            // 8. Platform Settings
            context.PlatformSettings.Add(new PlatformSettings
            {
                PlatformName = "KARAJAK AI",
                SupportEmail = "support@karajak.ai",
                BaseCurrency = "USD ($)",
                MaintenanceMode = false,
                AiValuationEngine = true,
                GlobalDarkMode = true,
                GeminiModel = "gemini-1.5-flash"
            });

            // 9. Admin Logs
            context.AdminLogs.AddRange(
                new AdminLog
                {
                    AdminId = admin.Id,
                    ActionType = "Approve Listing",
                    TargetEntity = "Car #1 (Porsche 911 GT3)",
                    Details = "Verified vehicle documentation and VIN.",
                    ActionDate = DateTime.UtcNow.AddDays(-10)
                },
                new AdminLog
                {
                    AdminId = admin.Id,
                    ActionType = "Verify Seller",
                    TargetEntity = "User #2 (Omar Khan)",
                    Details = "Approved commercial dealer license.",
                    ActionDate = DateTime.UtcNow.AddDays(-15)
                }
            );

            context.SaveChanges();
        }
    }
}
