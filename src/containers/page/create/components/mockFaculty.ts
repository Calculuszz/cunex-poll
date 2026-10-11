// ข้อมูลจำลองคณะ/สาขา สำหรับโพลประเภท "เฉพาะคณะ/สาขา" จนกว่าจะมี API จริง
export const MOCK_FACULTIES = [
    {
        value: 'eng', label: 'วิศวกรรมศาสตร์',
        departments: [
            { value: 'eng-cp', label: 'วิศวกรรมคอมพิวเตอร์' },
            { value: 'eng-ee', label: 'วิศวกรรมไฟฟ้า' },
        ],
    },
    {
        value: 'sci', label: 'วิทยาศาสตร์',
        departments: [
            { value: 'sci-math', label: 'คณิตศาสตร์' },
            { value: 'sci-chem', label: 'เคมี' },
        ],
    },
    {
        value: 'arts', label: 'อักษรศาสตร์',
        departments: [
            { value: 'arts-th', label: 'ภาษาไทย' },
            { value: 'arts-en', label: 'ภาษาอังกฤษ' },
        ],
    },
]
