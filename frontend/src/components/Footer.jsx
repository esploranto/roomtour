export default function Footer() {
    return (
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        © {new Date().getFullYear()} Roomtour. Все права защищены.
      </footer>
    );
  }