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
    {
        value: 'econ', label: 'เศรษฐศาสตร์',
        departments: [
            { value: 'econ-fin', label: 'เศรษฐศาสตร์การเงิน' },
            { value: 'econ-intl', label: 'เศรษฐศาสตร์ระหว่างประเทศ' },
        ],
    },
    {
        value: 'commarts', label: 'นิเทศศาสตร์',
        departments: [
            { value: 'commarts-mass', label: 'การสื่อสารมวลชน' },
            { value: 'commarts-film', label: 'ภาพยนตร์' },
        ],
    },
    {
        value: 'arch', label: 'สถาปัตยกรรมศาสตร์',
        departments: [
            { value: 'arch-arch', label: 'สถาปัตยกรรม' },
            { value: 'arch-land', label: 'ภูมิสถาปัตยกรรม' },
        ],
    },
    {
        value: 'psy', label: 'จิตวิทยา',
        departments: [
            { value: 'psy-psy', label: 'จิตวิทยา' },
        ],
    },
    {
        value: 'law', label: 'นิติศาสตร์',
        departments: [
            { value: 'law-law', label: 'นิติศาสตร์' },
        ],
    },
]
