-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Weighing" DROP CONSTRAINT "Weighing_employeeId_fkey";

-- AddForeignKey
ALTER TABLE "Weighing" ADD CONSTRAINT "Weighing_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
