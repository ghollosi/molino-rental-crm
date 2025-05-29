import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Creating 5 contract templates...')

  // Clean existing contract templates
  await prisma.contractTemplate.deleteMany()

  // Template 1: Standard Rental Agreement (Default)
  await prisma.contractTemplate.create({
    data: {
      name: 'Standard Bérleti Szerződés',
      description: 'Általános lakóingatlan bérleti szerződés sablona',
      category: 'RENTAL',
      title: 'BÉRLETI SZERZŐDÉS',
      isDefault: true,
      content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
  <h1 style="text-align: center; margin-bottom: 30px;">BÉRLETI SZERZŐDÉS</h1>
  
  <p><strong>Szerződés száma:</strong> {{contractNumber}}</p>
  <p><strong>Kelt:</strong> {{currentDate}}</p>
  
  <h2>1. SZERZŐDŐ FELEK</h2>
  
  <h3>BÉRBEADÓ:</h3>
  <p><strong>Név:</strong> {{ownerName}}<br>
  <strong>Cím:</strong> {{ownerAddress}}<br>
  <strong>Telefon:</strong> {{ownerPhone}}<br>
  <strong>Email:</strong> {{ownerEmail}}<br>
  <strong>Adószám:</strong> {{ownerTaxNumber}}</p>
  
  <h3>BÉRLŐ:</h3>
  <p><strong>Név:</strong> {{tenantName}}<br>
  <strong>Telefon:</strong> {{tenantPhone}}<br>
  <strong>Email:</strong> {{tenantEmail}}<br>
  <strong>Vészhelyzeti kapcsolat:</strong> {{emergencyContact}}</p>
  
  <h2>2. BÉRLETI TÁRGY</h2>
  <p><strong>Ingatlan címe:</strong> {{propertyAddress}}<br>
  <strong>Típus:</strong> {{propertyType}}<br>
  <strong>Terület:</strong> {{propertySize}} m²<br>
  <strong>Szobák száma:</strong> {{propertyRooms}} db<br>
  <strong>Emelet:</strong> {{propertyFloor}}</p>
  
  <h2>3. SZERZŐDÉS IDŐTARTAMA</h2>
  <p><strong>Kezdés:</strong> {{startDate}}<br>
  <strong>Lejárat:</strong> {{endDate}}<br>
  <strong>Időtartam:</strong> {{duration}} hónap</p>
  
  <h2>4. BÉRLETI DÍJ ÉS FIZETÉSI FELTÉTELEK</h2>
  <p><strong>Havi bérleti díj:</strong> {{rentAmount}} {{currency}}<br>
  <strong>Kaució:</strong> {{deposit}} {{currency}}<br>
  <strong>Fizetési határidő:</strong> minden hónap {{paymentDay}}. napja<br>
  <strong>Bankszámla:</strong> {{ownerBankAccount}}</p>
  
  <h2>5. BÉRLŐ KÖTELEZETTSÉGEI</h2>
  <ul>
    <li>A bérleti díj határidőben történő megfizetése</li>
    <li>Az ingatlan rendeltetésszerű használata</li>
    <li>Kisebb javítások, karbantartások elvégzése</li>
    <li>A szomszédok zavarásának mellőzése</li>
  </ul>
  
  <h2>6. BÉRBEADÓ KÖTELEZETTSÉGEI</h2>
  <ul>
    <li>Az ingatlan használatba adása</li>
    <li>Nagyobb javítások, felújítások elvégzése</li>
    <li>A nyugodt használat biztosítása</li>
  </ul>
  
  <h2>7. SZERZŐDÉS MEGSZŰNÉSE</h2>
  <p>A szerződés a megjelölt időtartam lejártával automatikusan megszűnik. 
  Előzetes felmondás esetén 30 napos felmondási idő alkalmazandó.</p>
  
  <h2>8. ZÁRÓ RENDELKEZÉSEK</h2>
  <p>A szerződésben nem szabályozott kérdésekben a Polgári Törvénykönyv rendelkezései az irányadók.</p>
  
  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{ownerName}}<br>Bérbeadó</p>
    </div>
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{tenantName}}<br>Bérlő</p>
    </div>
  </div>
</div>`,
      variables: {
        contractNumber: { type: 'string', required: true },
        currentDate: { type: 'date', required: true },
        ownerName: { type: 'string', required: true },
        ownerAddress: { type: 'string', required: true },
        ownerPhone: { type: 'string', required: true },
        ownerEmail: { type: 'string', required: true },
        ownerTaxNumber: { type: 'string', required: false },
        ownerBankAccount: { type: 'string', required: true },
        tenantName: { type: 'string', required: true },
        tenantPhone: { type: 'string', required: true },
        tenantEmail: { type: 'string', required: true },
        emergencyContact: { type: 'string', required: false },
        propertyAddress: { type: 'string', required: true },
        propertyType: { type: 'string', required: true },
        propertySize: { type: 'number', required: false },
        propertyRooms: { type: 'number', required: false },
        propertyFloor: { type: 'number', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: true },
        duration: { type: 'number', required: true },
        rentAmount: { type: 'number', required: true },
        deposit: { type: 'number', required: true },
        paymentDay: { type: 'number', required: true },
        currency: { type: 'string', required: true }
      }
    }
  })

  // Template 2: Commercial Lease
  await prisma.contractTemplate.create({
    data: {
      name: 'Üzleti Bérleti Szerződés',
      description: 'Irodák és üzlethelyiségek bérleti szerződése',
      category: 'COMMERCIAL',
      title: 'ÜZLETI BÉRLETI SZERZŐDÉS',
      content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
  <h1 style="text-align: center; margin-bottom: 30px;">ÜZLETI BÉRLETI SZERZŐDÉS</h1>
  
  <p><strong>Szerződés száma:</strong> {{contractNumber}}</p>
  <p><strong>Kelt:</strong> {{currentDate}}</p>
  
  <h2>1. SZERZŐDŐ FELEK</h2>
  
  <h3>BÉRBEADÓ:</h3>
  <p><strong>Név/Cégnév:</strong> {{ownerName}}<br>
  <strong>Cím/Székhely:</strong> {{ownerAddress}}<br>
  <strong>Telefon:</strong> {{ownerPhone}}<br>
  <strong>Email:</strong> {{ownerEmail}}<br>
  <strong>Adószám:</strong> {{ownerTaxNumber}}</p>
  
  <h3>BÉRLŐ:</h3>
  <p><strong>Cégnév:</strong> {{tenantName}}<br>
  <strong>Székhely:</strong> {{tenantAddress}}<br>
  <strong>Telefon:</strong> {{tenantPhone}}<br>
  <strong>Email:</strong> {{tenantEmail}}<br>
  <strong>Adószám:</strong> {{tenantTaxNumber}}<br>
  <strong>Képviseli:</strong> {{tenantRepresentative}}</p>
  
  <h2>2. BÉRLETI TÁRGY</h2>
  <p><strong>Ingatlan címe:</strong> {{propertyAddress}}<br>
  <strong>Funkció:</strong> {{businessFunction}}<br>
  <strong>Hasznos terület:</strong> {{propertySize}} m²<br>
  <strong>Helyiségek:</strong> {{roomDescription}}</p>
  
  <h2>3. BÉRLETI IDŐTARTAM</h2>
  <p><strong>Kezdés:</strong> {{startDate}}<br>
  <strong>Lejárat:</strong> {{endDate}}<br>
  <strong>Időtartam:</strong> {{duration}} hónap<br>
  <strong>Opciós időszak:</strong> {{optionPeriod}}</p>
  
  <h2>4. BÉRLETI DÍJ ÉS KÖLTSÉGEK</h2>
  <p><strong>Havi bérleti díj:</strong> {{rentAmount}} {{currency}} + ÁFA<br>
  <strong>Kaució:</strong> {{deposit}} {{currency}}<br>
  <strong>Közös költség:</strong> {{commonCost}} {{currency}}/hó<br>
  <strong>Fizetési határidő:</strong> minden hónap {{paymentDay}}. napja</p>
  
  <h2>5. HASZNÁLAT CÉLJA ÉS KORLÁTOZÁSOK</h2>
  <p><strong>Engedélyezett tevékenység:</strong> {{businessFunction}}<br>
  <strong>Nyitvatartás:</strong> {{businessHours}}<br>
  <strong>Korlátozások:</strong> {{restrictions}}</p>
  
  <h2>6. BÉRLŐ KÖTELEZETTSÉGEI</h2>
  <ul>
    <li>Bérleti díj és járulékos költségek megfizetése</li>
    <li>Ingatlan rendeltetésszerű használata</li>
    <li>Biztosítás fenntartása</li>
    <li>Hatósági engedélyek beszerzése</li>
  </ul>
  
  <h2>7. SZERZŐDÉS MÓDOSÍTÁSA ÉS MEGSZŰNÉSE</h2>
  <p>Felmondási idő: {{terminationNotice}} nap<br>
  Bérleti díj indexálása: {{indexation}}</p>
  
  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{ownerName}}<br>Bérbeadó</p>
    </div>
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{tenantRepresentative}}<br>{{tenantName}}<br>Bérlő</p>
    </div>
  </div>
</div>`,
      variables: {
        contractNumber: { type: 'string', required: true },
        currentDate: { type: 'date', required: true },
        ownerName: { type: 'string', required: true },
        ownerAddress: { type: 'string', required: true },
        ownerPhone: { type: 'string', required: true },
        ownerEmail: { type: 'string', required: true },
        ownerTaxNumber: { type: 'string', required: true },
        tenantName: { type: 'string', required: true },
        tenantAddress: { type: 'string', required: true },
        tenantPhone: { type: 'string', required: true },
        tenantEmail: { type: 'string', required: true },
        tenantTaxNumber: { type: 'string', required: true },
        tenantRepresentative: { type: 'string', required: true },
        propertyAddress: { type: 'string', required: true },
        businessFunction: { type: 'string', required: true },
        propertySize: { type: 'number', required: true },
        roomDescription: { type: 'string', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: true },
        duration: { type: 'number', required: true },
        optionPeriod: { type: 'string', required: false },
        rentAmount: { type: 'number', required: true },
        deposit: { type: 'number', required: true },
        commonCost: { type: 'number', required: false },
        paymentDay: { type: 'number', required: true },
        currency: { type: 'string', required: true },
        businessHours: { type: 'string', required: false },
        restrictions: { type: 'string', required: false },
        terminationNotice: { type: 'number', required: true },
        indexation: { type: 'string', required: false }
      }
    }
  })

  // Template 3: Student Housing
  await prisma.contractTemplate.create({
    data: {
      name: 'Diákszálló Bérleti Szerződés',
      description: 'Diákok számára kialakított bérleti szerződés',
      category: 'STUDENT',
      title: 'DIÁKSZÁLLÓ BÉRLETI SZERZŐDÉS',
      content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
  <h1 style="text-align: center; margin-bottom: 30px;">DIÁKSZÁLLÓ BÉRLETI SZERZŐDÉS</h1>
  
  <p><strong>Szerződés száma:</strong> {{contractNumber}}</p>
  <p><strong>Kelt:</strong> {{currentDate}}</p>
  
  <h2>1. SZERZŐDŐ FELEK</h2>
  
  <h3>BÉRBEADÓ:</h3>
  <p><strong>Név:</strong> {{ownerName}}<br>
  <strong>Cím:</strong> {{ownerAddress}}<br>
  <strong>Telefon:</strong> {{ownerPhone}}<br>
  <strong>Email:</strong> {{ownerEmail}}</p>
  
  <h3>BÉRLŐ (DIÁK):</h3>
  <p><strong>Név:</strong> {{tenantName}}<br>
  <strong>Születési hely, idő:</strong> {{birthPlace}}, {{birthDate}}<br>
  <strong>Lakcím:</strong> {{tenantAddress}}<br>
  <strong>Telefon:</strong> {{tenantPhone}}<br>
  <strong>Email:</strong> {{tenantEmail}}<br>
  <strong>Oktatási intézmény:</strong> {{university}}<br>
  <strong>Szülő/Gyám:</strong> {{parentName}} ({{parentPhone}})</p>
  
  <h2>2. BÉRLETI TÁRGY</h2>
  <p><strong>Szoba címe:</strong> {{propertyAddress}}<br>
  <strong>Szoba száma:</strong> {{roomNumber}}<br>
  <strong>Ágyszám:</strong> {{bedNumber}}<br>
  <strong>Közös helyiségek:</strong> {{commonAreas}}</p>
  
  <h2>3. SZERZŐDÉS IDŐTARTAMA</h2>
  <p><strong>Kezdés:</strong> {{startDate}}<br>
  <strong>Lejárat:</strong> {{endDate}}<br>
  <strong>Szemeszter:</strong> {{semester}}<br>
  <strong>Tanév:</strong> {{academicYear}}</p>
  
  <h2>4. BÉRLETI DÍJ</h2>
  <p><strong>Havi bérleti díj:</strong> {{rentAmount}} {{currency}}<br>
  <strong>Kaució:</strong> {{deposit}} {{currency}}<br>
  <strong>Rezsi:</strong> {{utilities}} {{currency}}/hó<br>
  <strong>Fizetési határidő:</strong> minden hónap {{paymentDay}}. napja</p>
  
  <h2>5. LAKÓHÁZI REND</h2>
  <ul>
    <li><strong>Csend:</strong> 22:00-08:00 között</li>
    <li><strong>Látogatók:</strong> {{visitorRules}}</li>
    <li><strong>Közös helyiségek használata:</strong> {{commonAreaRules}}</li>
    <li><strong>Háziállatok:</strong> {{petPolicy}}</li>
    <li><strong>Dohányzás:</strong> {{smokingPolicy}}</li>
  </ul>
  
  <h2>6. SPECIÁLIS FELTÉTELEK</h2>
  <ul>
    <li>A szerződés csak aktív hallgatói jogviszony mellett érvényes</li>
    <li>Tanulmányok befejezése esetén 30 napon belül el kell költözni</li>
    <li>Szülői/gyámi egyetértés szükséges</li>
  </ul>
  
  <div style="margin-top: 50px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="text-align: center;">
        <p>_________________________</p>
        <p>{{ownerName}}<br>Bérbeadó</p>
      </div>
      <div style="text-align: center;">
        <p>_________________________</p>
        <p>{{tenantName}}<br>Bérlő (diák)</p>
      </div>
    </div>
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{parentName}}<br>Szülő/Gyám egyetértése</p>
    </div>
  </div>
</div>`,
      variables: {
        contractNumber: { type: 'string', required: true },
        currentDate: { type: 'date', required: true },
        ownerName: { type: 'string', required: true },
        ownerAddress: { type: 'string', required: true },
        ownerPhone: { type: 'string', required: true },
        ownerEmail: { type: 'string', required: true },
        tenantName: { type: 'string', required: true },
        birthPlace: { type: 'string', required: true },
        birthDate: { type: 'date', required: true },
        tenantAddress: { type: 'string', required: true },
        tenantPhone: { type: 'string', required: true },
        tenantEmail: { type: 'string', required: true },
        university: { type: 'string', required: true },
        parentName: { type: 'string', required: true },
        parentPhone: { type: 'string', required: true },
        propertyAddress: { type: 'string', required: true },
        roomNumber: { type: 'string', required: true },
        bedNumber: { type: 'string', required: false },
        commonAreas: { type: 'string', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: true },
        semester: { type: 'string', required: true },
        academicYear: { type: 'string', required: true },
        rentAmount: { type: 'number', required: true },
        deposit: { type: 'number', required: true },
        utilities: { type: 'number', required: false },
        paymentDay: { type: 'number', required: true },
        currency: { type: 'string', required: true },
        visitorRules: { type: 'string', required: false },
        commonAreaRules: { type: 'string', required: false },
        petPolicy: { type: 'string', required: false },
        smokingPolicy: { type: 'string', required: false }
      }
    }
  })

  // Template 4: Seasonal Rental
  await prisma.contractTemplate.create({
    data: {
      name: 'Szezonális Bérleti Szerződés',
      description: 'Rövid távú, szezonális bérletek szerződése',
      category: 'SEASONAL',
      title: 'SZEZONÁLIS BÉRLETI SZERZŐDÉS',
      content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
  <h1 style="text-align: center; margin-bottom: 30px;">SZEZONÁLIS BÉRLETI SZERZŐDÉS</h1>
  
  <p><strong>Szerződés száma:</strong> {{contractNumber}}</p>
  <p><strong>Kelt:</strong> {{currentDate}}</p>
  
  <h2>1. SZERZŐDŐ FELEK</h2>
  
  <h3>BÉRBEADÓ:</h3>
  <p><strong>Név:</strong> {{ownerName}}<br>
  <strong>Cím:</strong> {{ownerAddress}}<br>
  <strong>Telefon:</strong> {{ownerPhone}}<br>
  <strong>Email:</strong> {{ownerEmail}}</p>
  
  <h3>BÉRLŐ:</h3>
  <p><strong>Név:</strong> {{tenantName}}<br>
  <strong>Lakcím:</strong> {{tenantAddress}}<br>
  <strong>Telefon:</strong> {{tenantPhone}}<br>
  <strong>Email:</strong> {{tenantEmail}}<br>
  <strong>Személyi szám:</strong> {{tenantId}}</p>
  
  <h2>2. BÉRLETI TÁRGY</h2>
  <p><strong>Ingatlan címe:</strong> {{propertyAddress}}<br>
  <strong>Típus:</strong> {{propertyType}}<br>
  <strong>Férőhely:</strong> {{maxOccupancy}} fő<br>
  <strong>Felszereltség:</strong> {{amenities}}</p>
  
  <h2>3. BÉRLETI IDŐSZAK</h2>
  <p><strong>Check-in:</strong> {{startDate}} {{checkInTime}}<br>
  <strong>Check-out:</strong> {{endDate}} {{checkOutTime}}<br>
  <strong>Éjszakák száma:</strong> {{nights}}<br>
  <strong>Szezon:</strong> {{season}}</p>
  
  <h2>4. BÉRLETI DÍJ ÉS KÖLTSÉGEK</h2>
  <p><strong>Összes bérleti díj:</strong> {{totalAmount}} {{currency}}<br>
  <strong>Éjszakánkénti díj:</strong> {{nightlyRate}} {{currency}}<br>
  <strong>Kaució:</strong> {{deposit}} {{currency}}<br>
  <strong>Takarítási díj:</strong> {{cleaningFee}} {{currency}}<br>
  <strong>Idegenforgalmi adó:</strong> {{touristTax}} {{currency}}/fő/éj</p>
  
  <h2>5. FIZETÉSI FELTÉTELEK</h2>
  <p><strong>Foglalási díj (30%):</strong> {{reservationFee}} {{currency}} - azonnal<br>
  <strong>Fennmaradó összeg:</strong> {{remainingAmount}} {{currency}} - érkezéskor<br>
  <strong>Kaució visszafizetése:</strong> távozás után 7 napon belül</p>
  
  <h2>6. HÁZIRENDEK ÉS KORLÁTOZÁSOK</h2>
  <ul>
    <li><strong>Maximális létszám:</strong> {{maxOccupancy}} fő</li>
    <li><strong>Zajcsillapítás:</strong> {{quietHours}}</li>
    <li><strong>Dohányzás:</strong> {{smokingPolicy}}</li>
    <li><strong>Háziállatok:</strong> {{petPolicy}}</li>
    <li><strong>Parkolás:</strong> {{parkingInfo}}</li>
  </ul>
  
  <h2>7. LEMONDÁSI FELTÉTELEK</h2>
  <p><strong>Ingyenes lemondás:</strong> {{freeCancellation}} nappal érkezés előtt<br>
  <strong>Részleges visszatérítés:</strong> {{partialRefund}}<br>
  <strong>Nem visszatéríthető:</strong> {{nonRefundable}}</p>
  
  <h2>8. EXTRÁK ÉS SZOLGÁLTATÁSOK</h2>
  <p>{{extras}}</p>
  
  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{ownerName}}<br>Bérbeadó</p>
    </div>
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{tenantName}}<br>Bérlő</p>
    </div>
  </div>
</div>`,
      variables: {
        contractNumber: { type: 'string', required: true },
        currentDate: { type: 'date', required: true },
        ownerName: { type: 'string', required: true },
        ownerAddress: { type: 'string', required: true },
        ownerPhone: { type: 'string', required: true },
        ownerEmail: { type: 'string', required: true },
        tenantName: { type: 'string', required: true },
        tenantAddress: { type: 'string', required: true },
        tenantPhone: { type: 'string', required: true },
        tenantEmail: { type: 'string', required: true },
        tenantId: { type: 'string', required: true },
        propertyAddress: { type: 'string', required: true },
        propertyType: { type: 'string', required: true },
        maxOccupancy: { type: 'number', required: true },
        amenities: { type: 'string', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: true },
        checkInTime: { type: 'string', required: true },
        checkOutTime: { type: 'string', required: true },
        nights: { type: 'number', required: true },
        season: { type: 'string', required: false },
        totalAmount: { type: 'number', required: true },
        nightlyRate: { type: 'number', required: true },
        deposit: { type: 'number', required: true },
        cleaningFee: { type: 'number', required: false },
        touristTax: { type: 'number', required: false },
        reservationFee: { type: 'number', required: true },
        remainingAmount: { type: 'number', required: true },
        currency: { type: 'string', required: true },
        quietHours: { type: 'string', required: false },
        smokingPolicy: { type: 'string', required: false },
        petPolicy: { type: 'string', required: false },
        parkingInfo: { type: 'string', required: false },
        freeCancellation: { type: 'number', required: true },
        partialRefund: { type: 'string', required: false },
        nonRefundable: { type: 'string', required: false },
        extras: { type: 'string', required: false }
      }
    }
  })

  // Template 5: Sublease Agreement
  await prisma.contractTemplate.create({
    data: {
      name: 'Albérleti Szerződés',
      description: 'Albérlet esetén alkalmazható szerződés sablon',
      category: 'SUBLEASE',
      title: 'ALBÉRLETI SZERZŐDÉS',
      content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
  <h1 style="text-align: center; margin-bottom: 30px;">ALBÉRLETI SZERZŐDÉS</h1>
  
  <p><strong>Szerződés száma:</strong> {{contractNumber}}</p>
  <p><strong>Kelt:</strong> {{currentDate}}</p>
  
  <h2>1. SZERZŐDŐ FELEK</h2>
  
  <h3>FŐBÉRLŐ (ALBÉRLETADÓ):</h3>
  <p><strong>Név:</strong> {{mainTenantName}}<br>
  <strong>Lakcím:</strong> {{mainTenantAddress}}<br>
  <strong>Telefon:</strong> {{mainTenantPhone}}<br>
  <strong>Email:</strong> {{mainTenantEmail}}</p>
  
  <h3>ALBÉRLŐ:</h3>
  <p><strong>Név:</strong> {{subTenantName}}<br>
  <strong>Lakcím:</strong> {{subTenantAddress}}<br>
  <strong>Telefon:</strong> {{subTenantPhone}}<br>
  <strong>Email:</strong> {{subTenantEmail}}<br>
  <strong>Munkahely:</strong> {{workplace}}</p>
  
  <h3>TULAJDONOS HOZZÁJÁRULÁSA:</h3>
  <p><strong>Tulajdonos neve:</strong> {{ownerName}}<br>
  <strong>Hozzájárulás kelte:</strong> {{ownerConsent}}</p>
  
  <h2>2. ALBÉRLETI TÁRGY</h2>
  <p><strong>Ingatlan címe:</strong> {{propertyAddress}}<br>
  <strong>Albérletbe adott rész:</strong> {{subleaseArea}}<br>
  <strong>Terület:</strong> {{areaSize}} m²<br>
  <strong>Közös használatú helyiségek:</strong> {{sharedAreas}}</p>
  
  <h2>3. SZERZŐDÉS IDŐTARTAMA</h2>
  <p><strong>Kezdés:</strong> {{startDate}}<br>
  <strong>Lejárat:</strong> {{endDate}}<br>
  <strong>Főbérleti szerződés lejárata:</strong> {{mainLeaseEnd}}<br>
  <strong>Meghosszabbítás:</strong> {{renewalTerms}}</p>
  
  <h2>4. ALBÉRLETI DÍJ ÉS KÖLTSÉGEK</h2>
  <p><strong>Havi albérleti díj:</strong> {{rentAmount}} {{currency}}<br>
  <strong>Kaució:</strong> {{deposit}} {{currency}}<br>
  <strong>Rezsi hozzájárulás:</strong> {{utilities}} {{currency}}/hó<br>
  <strong>Internet/TV:</strong> {{internetTv}} {{currency}}/hó<br>
  <strong>Fizetési határidő:</strong> minden hónap {{paymentDay}}. napja</p>
  
  <h2>5. HASZNÁLATI SZABÁLYOK</h2>
  <ul>
    <li><strong>Saját szoba:</strong> {{privateRoom}}</li>
    <li><strong>Közös helyiségek:</strong> {{sharedUsage}}</li>
    <li><strong>Látogatók:</strong> {{visitorPolicy}}</li>
    <li><strong>Háztartási teendők:</strong> {{householdDuties}}</li>
    <li><strong>Zajcsillapítás:</strong> {{noisePolicy}}</li>
  </ul>
  
  <h2>6. JOGOK ÉS KÖTELEZETTSÉGEK</h2>
  
  <h3>FŐBÉRLŐ KÖTELEZETTSÉGEI:</h3>
  <ul>
    <li>Albérleti lehetőség biztosítása</li>
    <li>Közös költségek kezelése</li>
    <li>Tulajdonos felé való beszámolás</li>
  </ul>
  
  <h3>ALBÉRLŐ KÖTELEZETTSÉGEI:</h3>
  <ul>
    <li>Albérleti díj fizetése</li>
    <li>Házirendek betartása</li>
    <li>Közös helyiségek gondozása</li>
  </ul>
  
  <h2>7. SZERZŐDÉS MEGSZŰNÉSE</h2>
  <p><strong>Felmondási idő:</strong> {{noticePeriod}} nap<br>
  <strong>Rendkívüli felmondás:</strong> {{extraordinaryTermination}}<br>
  <strong>Főbérleti szerződés megszűnése esetén:</strong> albérleti szerződés automatikusan megszűnik</p>
  
  <div style="margin-top: 50px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="text-align: center;">
        <p>_________________________</p>
        <p>{{mainTenantName}}<br>Főbérlő</p>
      </div>
      <div style="text-align: center;">
        <p>_________________________</p>
        <p>{{subTenantName}}<br>Albérlő</p>
      </div>
    </div>
    <div style="text-align: center;">
      <p>_________________________</p>
      <p>{{ownerName}}<br>Tulajdonos hozzájárulása</p>
    </div>
  </div>
</div>`,
      variables: {
        contractNumber: { type: 'string', required: true },
        currentDate: { type: 'date', required: true },
        mainTenantName: { type: 'string', required: true },
        mainTenantAddress: { type: 'string', required: true },
        mainTenantPhone: { type: 'string', required: true },
        mainTenantEmail: { type: 'string', required: true },
        subTenantName: { type: 'string', required: true },
        subTenantAddress: { type: 'string', required: true },
        subTenantPhone: { type: 'string', required: true },
        subTenantEmail: { type: 'string', required: true },
        workplace: { type: 'string', required: false },
        ownerName: { type: 'string', required: true },
        ownerConsent: { type: 'date', required: true },
        propertyAddress: { type: 'string', required: true },
        subleaseArea: { type: 'string', required: true },
        areaSize: { type: 'number', required: false },
        sharedAreas: { type: 'string', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: true },
        mainLeaseEnd: { type: 'date', required: true },
        renewalTerms: { type: 'string', required: false },
        rentAmount: { type: 'number', required: true },
        deposit: { type: 'number', required: true },
        utilities: { type: 'number', required: false },
        internetTv: { type: 'number', required: false },
        paymentDay: { type: 'number', required: true },
        currency: { type: 'string', required: true },
        privateRoom: { type: 'string', required: false },
        sharedUsage: { type: 'string', required: false },
        visitorPolicy: { type: 'string', required: false },
        householdDuties: { type: 'string', required: false },
        noisePolicy: { type: 'string', required: false },
        noticePeriod: { type: 'number', required: true },
        extraordinaryTermination: { type: 'string', required: false }
      }
    }
  })

  console.log('✅ 5 contract templates created successfully!')
  console.log('\n📋 Created templates:')
  console.log('1. Standard Bérleti Szerződés (Default)')
  console.log('2. Üzleti Bérleti Szerződés')
  console.log('3. Diákszálló Bérleti Szerződés')
  console.log('4. Szezonális Bérleti Szerződés')
  console.log('5. Albérleti Szerződés')
}

main()
  .catch((e) => {
    console.error('❌ Template seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })